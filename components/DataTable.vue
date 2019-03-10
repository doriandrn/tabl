<template lang="pug">
.table(
  data-table
)
  .choice
    importer(
      v-if=       "!hasContents && writePermissions && !status.message"
      :noHeaders= "Boolean(headers.length)"

      @header=    "setHeader($event.i, $event.header)"
      @rowcontent=   "insertRow"
      @parsed=    "waitForData"
    )

    .table_actions
      .right
        input(
          type=     "search",
          v-model=  "search"
          v-if=     "total > 2"
        )
        input(
          type=     "number",
          v-model=  "criteria.limit"
          v-if=     "total > criteria.limit"
          max=      "250"
          min=      "2"
        )
        button(
          v-if=   "!status.message"
          @click= "print"
        ) print
        button share
        button(@click="dump") export
        button settings

    h4(v-if=  "!hasContents && !writePermissions") This table has no data.

    table(
      v-else
      :class=       "{ fetching, compact }"
      cellspacing=  0
    )
      thead.heading
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

          resize(
            v-if=     "resizableCols"
            :height=  "height"
          )

      tbody
        tr.working(v-if=  "status.message")
          td(:colspan=  "headersVals.length + 1")
            em
              strong {{ status.message }}
              progress-bar(:eta=  "status.eta")
              small estimated: {{ status.eta }} seconds

        tr.new(v-if= "writePermissions && !status.message")
          cell(
            v-for=        "i in columnsLength"
            :key=         "`new${i}`"
            @change=       "setContent(undefined, { [`c${i}`]: $event });"
          )
        tr(
          v-for=  "j in contents.length"
          :class= "{ last: last === contents.ids[j - 1], active: activeRow === contents.ids[j - 1]}"
          @click= "selectRow(contents.ids[j - 1])"
        )
          cell(
            v-for=        "i in columnsLength"
            :key=         "`${contents.ids[j - 1]}${i}`"
            :editable=    "writePermissions"
            :reference=   "contents.ids[j - 1] || ''"
            :value=       "cell(contents.ids[j - 1], i)"
            @change=       "setContent(contents.ids[j - 1], { [`c${i}`]: $event })"
            @click=       "activeColumn = `c${i}`"
          )
      tfoot
        tr
          td.meta(v-if="contents.length") {{ contents.length }} of {{ total }}
          td.meta(v-if="fetching") fetching

    button(
      v-if=   "contents.length < total || (searching && contents.length > criteria.limit)"
      @click= "increaseIndex"
    ) more!

    slot
</template>

<script lang="ts">
import { observable, reaction, toJS } from 'mobx'
import { Observer } from 'mobx-vue'
import { Component, Vue } from 'nuxt-property-decorator'
import Subscriber from 'rxcollection-subscriber'
import { RxDatabase, RxCollection, create, plugin } from 'rxdb';

import importer from '~/components/import'
import cell from '~/components/cell'
import progressBar from '~/components/progress'
import resize from '~/components/resizeColBar'

plugin(require('pouchdb-adapter-memory')) // temoporary tables
plugin(require('pouchdb-adapter-idb')) // production
plugin(require('pouchdb-adapter-http')) // pt sync

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
    },
    height () {
      if (!this.$el) return
      return this.$el.offsetHeight
    }
  },
  props: {
    id: {
      type: String,
      default: 'untitled'
    },
    title: {
      type: String
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
      default: 25
    },
    temporary: {
      type: Boolean,
      default: true
    },
    writePermissions: {
      type: Boolean,
      default: false
    },

    totalCount: {
      type: Number,
      default: -1
    },
    favorites: {
      type: Boolean,
      default: true
    },
    resizableCols: {
      type: Boolean,
      default: true
    },
    compact: {
      type: Boolean,
      default: false
    }
  },
  components: {
    cell,
    importer,
    progressBar,
    resize
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
  activeRow = ''

  status = {
    message: '',
    eta: undefined
  }

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

  set total (val) {
    this.$emit('newTotal', val)
  }

  get total () {
    return this.totalCount
  }

  get cell () {
    return (id, column) => this.contents.items[id] ? this.contents.items[id][`c${column}`] || '' : ''
  }

  async waitForData ({ i, size }) {
    this.total = i
    this.status = {
      message: `Processing ${i} entries`,
      eta: Math.floor(size / 4000)
    }
    await this.subscribers.contents.updates
    this.status = {
      message: '',
      eta: undefined
    }
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

    if (this.favorites) {
      Object.assign(cols.contents.schema.properties, { fav: {
        type: 'boolean'
      }})
    }

    this.db = await create({
      name: `tt/${this.id}`,
      adapter: this.temporary ? 'memory' : 'idb',
      ignoreDuplicate: this.temporary ? true : false,
      multiInstance: false
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
    if (method === 'insert') this.total += 1
    this.last = _id
  }

  insertRow (data: string[]) {
    const colData = {}
    data.map((val, i) => { colData[`c${i + 1}`] = val })

    this.collections.contents.insert(colData)
  }

  selectRow (id: string) {
    this.activeRow = id
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
    const { subscribers, db } = this
    if (subscribers) {
      const { headers, contents } = subscribers
      if (contents) await contents.kill()
      if (headers) await headers.kill()
    }
    if (this.collections) {
      this.collections.contents.destroy()
      this.collections.headers.destroy()
    }
    if (db) await db.destroy()
  }

  get searching () {
    return this.search.length > 0
  }

  print () {
    window.print()
  }

  dump () {}
}
</script>

<style lang="stylus">
@require '~assets/styles/base'

cellY = 4px
cellX = 8px

thbg = pal.secondary

headerfonts()
  font-family: fonts.headings
  font-size 14px
  line-height 32px
  font-weight 500
  color: pal.secondary
  letter-spacing 0

.table
  &_actions
    display flex
    flex-flow row wrap
    margin-bottom 20px

    @media print
      display none

    .right
      margin-left auto
      >*
        &:not(:last-child)
          margin-right 12px

[data-table]
  margin-bottom 32px

  table
    border 0
    padding 0
    width 100%
    display inline-block
    margin 0 auto
    background transparent
    max-width 100%
    overflow-x auto

    th
    td
      padding 0
      margin 0
      position relative
      text-align left
      border 1px solid transparent
      border-bottom-color rgba(black, .05)

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

    &.compact
      td
        max-width 20%
        overflow-x auto

        > [contenteditable]
          white-space nowrap
          max-width 100%
          overflow hidden

    th
      border-top-color red
      &.new
        max-width 80px
        width 80px

        &:first-child:last-child
          max-width 100%
          width 100%

      &.sortable
        input
          position absolute
          left: 0
          top: 0
          z-index 0

          &:focuss
          &:active
            z-index 2
            border-color: thbg

          &+span
            display inline-block
            vertical-align top
            position relative
            margin-right 40px // loc ca user sa dea click pe mobil sa editeze
            padding: cellY cellX
            bottom 0
            z-index 1
            cursor pointer
            user-select none
            white-space nowrap
            headerfonts()
            color transparent

            @media print
              color black
              font-weight 600

            &:after
              content ''
              position absolute
              right -12px
              top 50%
              transform translateY(-50%)
              background url('data:image/svg+xml;base64,PHN2ZyBoZWlnaHQ9IjE4IiB2aWV3Qm94PSIwIDAgMjQgMjQiIHdpZHRoPSIxOCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICAgIDxwYXRoIGQ9Ik0wIDBoMjR2MjRIMFYweiIgZmlsbD0ibm9uZSIvPgogICAgPHBhdGggZD0iTTIwIDEybC0xLjQxLTEuNDFMMTMgMTYuMTdWNGgtMnYxMi4xN2wtNS41OC01LjU5TDQgMTJsOCA4IDgtOHoiIGZpbGw9IiM1NTU1NTUiLz4KPC9zdmc+')
              background-size 100%
              width 14px
              height 14px
              display inline-block
              vertical-align middle
              pointer-events none
              margin-left 10px
              opacity 0
              visibility hidden
              transition transform .15s ease

            &:hover
              &:after
                opacity 1
                visibility visible

        &.sort
          input
            opacity 1
            &+span
              &:after
                opacity 1
                visibility visible

        &.reverse
          input+span:after
            transform rotate(180deg) translateY(50%)
    tr
      position relative

      &.active
        td
          background: rgba(pal.highlight, .05)

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

      &.working > td
        text-align center
        padding 40px

        em
        strong
          display block

        .progress
          margin 16px auto

    thead
      th
        border-bottom-width 2px

        span
          display block

        @media print
          span
            color black

        input
          width 100%
          headerfonts()

          @media print
            display none

    &.fetching
      thead
        th
          border-bottom: 2px solid pal.principal

    tfoot
      @media print
        display none

      tr
        td
          padding-top 24px
          border 0
          background transparent

.import
  padding 32px
  margin-bottom 20px
  background #fafafa
  border-radius 15px
  text-align center

.choice
  display flex
  flex-flow column nowrap

.new
  @media print
    display none
</style>
