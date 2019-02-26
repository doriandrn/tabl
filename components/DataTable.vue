<template lang="pug">
.table(
  data-table
)
  input(
    placeholder=  "Please name this table..."
  )

  .choice
    importer(
      v-if=   "!hasContents && writePermissions"
      :noHeaders= "Boolean(headers.length)"

      @header=    "setHeader($event.i, $event.header)"
      @content=   "setContent(undefined, $event)"
    )

    .table-actions(v-if="hasContents")
      .right
        input(type="search", v-model="search")
        input(type="number", v-model="criteria.limit")
        button print
        button share
        button export
        button settings

    h4(v-if=  "!hasContents && !writePermissions") This table has no data.

    table(
      v-else
      :class=       "{ fetching }"
      cellspacing=  0
    )
      thead
        th(
          v-for="i in columnsLength"
          :class= "{\
            new: i === headers.length + 1 && !headersVals[i - 1],\
            sortable: contents.length > 1,\
            sort: criteria.sort && criteria.sort['c' + String(i)] !== undefined,\
            reverse: criteria.sort && criteria.sort['c' + String(i)] === -1 }"
        )
          input(
            v-if=     "writePermissions"
            @change=  "setHeader(i, $event.target.value)"
            :value=   "headersVals[i - 1]"
          )
          span(
            v-if= "contents.length > 1"
            @click=   "sort(i)"
          ) {{ headersVals[i - 1] }}
      tbody
        tr.new(v-if= "writePermissions")
          cell(
            v-for=        "i in columnsLength"
            :key=         "`new${i}`"
            @input=       "setContent(undefined, { [`c${i}`]: $event.target.value });"
          )
        tr(
          v-for=  "j in contents.length"
          :class= "{ last: last === contents.ids[j - 1] }"
        )
          cell(
            v-for=        "i in columnsLength"
            :key=         "`${contents.ids[j - 1]}${i}`"
            :editable=    "writePermissions"
            :reference=   "contents.ids[j - 1] || ''"
            :value=       "cell(contents.ids[j - 1], i)"
            @input=       "setContent(contents.ids[j - 1], { [`c${i}`]: $event.target.value })"
            @click=       "activeColumn = `c${i}`"
          )
      tfoot
        tr
          td.meta(v-if="contents.length") {{ contents.length }} of total
          td.meta(v-if="fetching") fetching

    button(
      v-if=   "contents.length === criteria.limit"
      @click= "increaseIndex"
    ) more!
</template>

<script lang="ts">
import { observable, reaction, toJS } from 'mobx'
import { Observer } from 'mobx-vue'
import { Component, Vue } from 'nuxt-property-decorator'
import Subscriber from 'rxcollection-subscriber'
import { RxDatabase, RxCollection, create, plugin } from 'rxdb';

import importer from '~/components/import'
import cell from '~/components/cell'

plugin(require('pouchdb-adapter-memory'))

@Component({
  computed: {
    headersVals () {
      return this.headers.ids.map(id => this.headers.items[Number(id)].name)
    },
    hasContents () {
      return this.headers.length && this.contents.length
    },
    columnsLength () {
      const { length } = this.headers
      return this.writePermissions ? length + 1 : length
    }
  },
  props: {
    id: {
      type: String,
      default: 'untitled'
    },
    recordHistory: {
      type: Boolean,
      default: false
    },
    searchable: {
      type: Boolean,
      default: true
    },
    maxCols: {
      type: Number,
      default: 10
    },
    temporary: {
      type: Boolean,
      default: true
    },
    writePermissions: {
      type: Boolean,
      default: false
    }
  },
  components: {
    importer,
    cell
  },
  watch: {
    search: function (val) {
      const { length } = this.subscribers.headers
      const $or = []
      const query = { $or }
      for (let i = 1; i <= length; i++) {
        $or.push({ [`c${i}`]: { $regex: `.*${val}.*` } })
      }
      this.criteria.filter = query
    }
  }
})
export default class DataTable extends Vue {
  fetching = false
  criteria = {}
  last = ''
  search = ''
  clear = ''
  activeColumn = ''

  headers = {
    items: {},
    ids: [],
    length: 0
  }

  contents = {
    items: {},
    ids: [],
    length: 0
  }

  get cell () {
    return (id, column) => this.contents.items[id] ? this.contents.items[id][`c${column}`] || '' : ''
  }

  // vue privates
  created () {
    this.subscribers = {}
    this.collections = {}
  }

  async mounted () {
    const cols = Object.assign({}, {
      headers: {
        name: 'headers',
        schema: {
          title: 'header',
          version: 0,
          type: 'object',
          properties: {
            index: { type: 'string', primary: true },
            name: { type: 'string' }
          },
          required: ['index']
        }
      },
      contents: {
        name: 'contents',
        schema: {
          title: 'item',
          version: 0,
          type: 'object',
          properties: {
            addedAt: { type: 'number', index: true },
            updatedAt: { type: 'number', index: true }
          }
        }
      }
    })

    for (let i = 1; i <= this.maxCols; i ++) {
      Object.assign(cols.contents.schema.properties, { [`c${i}`]: {
        type: 'string',
        index: true
      }})
    }

    this.db = await create({
      name: `tt_${this.id}_${Date.now()}`,
      adapter: this.temporary ? 'memory' : 'idb',
      ignoreDuplicate: true
    })

    await Promise.all(Object.keys(cols).map(col => this.db.collection(cols[col])))

    this.collections = this.db.collections

    const { subscribers, collections } = this

    subscribers.headers = new Subscriber(collections.headers)
    subscribers.contents = new Subscriber(collections.contents, {
      progressivePaging: true,
      // criteria: {
      //   sort: { addedAt: 1 }
      // }
    })

    const { headers, contents } = subscribers

    contents.criteria.sort = { addedAt: -1 }

    reaction(() => contents.fetching, () => {
      this.fetching = contents.fetching
    })

    reaction(() => contents.items, () => {
      this.contents.items = contents.items
      this.contents.ids = contents.ids
      this.contents.length = contents.length
      this.criteria = contents.criteria
    })

    reaction(() => headers.ids, () => {
      this.headers.items = headers.items
      this.headers.ids = headers.ids
      this.headers.length = headers.length
    })

    // reaction(() => ({ ...contents.items }), async (changes) => {

    //   console.log("FFS", changes)
    // })

    this.$emit('loaded')
  }

  setHeader (index: number, value: string) {
    this.collections.headers.upsert({
      name: value,
      index: String(index)
    })
  }

  async setContent (_id, content: {}) {
    const method = _id ? 'upsert' : 'insert'

    const curValue = toJS(this.subscribers.contents.items[_id])
    content = Object.assign(
      {},
      ...toJS(curValue ? Object.assign(curValue, { ... content }) : content),
      { [method === 'upsert' ? 'updatedAt' : 'addedAt']: Date.now() }
    )
    const doc = await this.collections.contents[method]({ ...content })
    if (!_id) _id = doc._id
    this.last = _id


  }

  sort (index) {
    const { criteria } = this.subscribers.contents
    const active = criteria.sort[`c${index}`] > 0
    const sortQuery = { [`c${index}`]: active ? -1 : 1 }
    criteria.sort = sortQuery
  }

  increaseIndex () {
    this.subscribers.contents.criteria.index += 1
  }

  select (id) {
    this.subscribers.contents.select(id)
  }

  async beforeDestroy () {
    await this.subscribers.headers.kill()
    await this.subscribers.contents.kill()
    await this.db.destroy()
  }

  get searching () {
    return this.search.length > 0
  }
}
</script>

<style lang="stylus">
cellY = 4px
cellX = 8px

headerfonts()
  font-size 16px
  line-height 24px
  font-weight bold

.table
  &-actions
    display flex
    flex-flow row wrap
    margin-bottom 20px

    .right
      margin-left auto
      >*
        &:not(:last-child)
          margin-right 12px

[data-table]
  margin-bottom 32px

table
  border 0
  padding 40px
  width auto
  display inline-block
  margin 0 auto

  th
  td
    padding 0
    margin 0
    position relative
    text-align left
    border 1px solid rgba(black, .05)

    &:not(:last-child)
      border-right 0

  td
    border-top 0

  input
  textarea
    border 0
    box-shadow none
    padding: cellY cellX
    background transparent
    width 100%
    font-size 15px
    line-height 24px
    max-width 100%
    max-height 100%
    resize none

    &:focus
      outline 0
      box-shadow 0

  th
    &.new
      max-width 40px
      width 40px

    &.sortable
      input
        padding-right 40px // loc ca user sa dea click pe mobil sa editeze
        opacity 0

        &+span
          position absolute
          left: 0
          top: 0
          padding: cellY cellX
          bottom 0
          z-index 1
          cursor pointer
          user-select none
          headerfonts()

          &:after
            content ''
            position relative
            background url('data:image/svg+xml;base64,PHN2ZyBoZWlnaHQ9IjE4IiB2aWV3Qm94PSIwIDAgMjQgMjQiIHdpZHRoPSIxOCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICAgIDxwYXRoIGQ9Ik0wIDBoMjR2MjRIMFYweiIgZmlsbD0ibm9uZSIvPgogICAgPHBhdGggZD0iTTIwIDEybC0xLjQxLTEuNDFMMTMgMTYuMTdWNGgtMnYxMi4xN2wtNS41OC01LjU5TDQgMTJsOCA4IDgtOHoiIGZpbGw9IiM1NTU1NTUiLz4KPC9zdmc+')
            background-size 100%
            width 14px
            height 14px
            display inline-block
            vertical-align middle
            margin-left 10px
            opacity 0
            visibility hidden
            transition transform .15s ease

      &.sort
      &:hover
      &:focus
        input
          opacity 1
          &+span
            &:after
              opacity 1
              visibility visible

      &.reverse
        input+span:after
          transform rotate(180deg)
  tr
    &.new
      td
        background rgba(black, .05)

        // textarea
        //   line-height 0
        //   transition all .15s ease-in-out

        //   &:hover
        //   &:focus
        //     line-height 24px

    &.last
      td
        background rgba(#a0ff32, .05)

  thead
    th
      border-bottom-width 2px

      input
        headerfonts()

  tfoot
    tr
      td
        padding-top 24px
        border 0

.import
  padding 32px
  margin-bottom 20px
  background #fafafa
  border-radius 15px
  text-align center

.choice
  display flex
  flex-flow column nowrap
</style>
