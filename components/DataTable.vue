<template lang="pug">
.table(
  data-table
)
  input(placeholder="Please name this table...")

  form.import(v-if="headers.length === 0")
    label(for="import") Import
    input(type="file" name="import" :accept="knownReadFormats")
    input(type="submit")
    p.meta known formats:

  .table-actions(v-else)
    .right
      input(type="search", v-model="search")
      button print
      button share
      button export
      button settings

  table(:class="{ fetching }" cellspacing=0)
    thead
      th(v-for="i in headers.length + 1")
        input(
          @change=  "setHeader(i, $event.target.value)"
          :value=   "headersVals[i - 1]"
        )
        span(
          @click=   "sort(i)"
        ) {{ headersVals [i - 1] }}
    tbody
      tr(
        v-for=  "j in contents.length + 1"
        :class= "{ new: j === contents.length + 1, last: last === contents.ids[j - 1] }"
      )
        td(v-for="i in headers.length + 1")
          input(
            :tabindex = "j <= contents.length && i <= headers.length ? j * 100 + i : -1"
            @change= "setContent(contents.ids[j - 1], { [`c${i}`]: $event.target.value })"
            :value=  "contents.items[contents.ids[j - 1]] ? contents.items[contents.ids[j - 1]][`c${i}`] : undefined"
          )
    tfoot
      tr
        td.meta {{ contents.length }} of total

  p(v-if="fetching") fetching!

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
plugin(require('pouchdb-adapter-memory'))

const cols = {
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
      properties: {}
    }
  }
}

let colsCount: number = 0
let collections: { [k: string]: RxCollection } = {}
let db: RxDatabase
const subscribers = {}

@Component({
  computed: {
    headersVals () {
      return this.headers.ids.map(id => this.headers.items[Number(id)].name)
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
    }
  }
})
export default class DataTable extends Vue {
  fetching = false
  criteria = {}
  last = ''
  search = ''

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

  async mounted () {
    for (let i = 1; i <= this.maxCols; i ++) {
      Object.assign(cols.contents.schema.properties, { [`c${i}`]: {
        type: 'string',
        index: true
      }})
    }

    db = await create({
      name: `zable_${Date.now()}`,
      adapter: 'memory',
      ignoreDuplicate: true
    })

    await Promise.all(Object.keys(cols).map(col => db.collection(cols[col])))

    collections = db.collections

    subscribers.headers = new Subscriber(collections.headers)
    subscribers.contents = new Subscriber(collections.contents, { progressivePaging: true })

    const { headers, contents } = subscribers

    reaction(() => contents.fetching, () => this.fetching = contents.fetching)

    reaction(() => [...headers.ids], () => {
      this.headers.items = headers.items
      this.headers.ids = headers.ids
      this.headers.length = headers.length
    })

    reaction(() => ({ ...contents.items }), (changes) => {
      this.contents.items = contents.items
      this.contents.ids = contents.ids
      this.contents.length = contents.length
      this.criteria = contents.criteria
    })

    this.$emit('loaded')
  }

  setHeader (index: number, value: string) {
    collections.headers.upsert({
      name: value,
      index: String(index)
    })
  }

  async setContent (_id, content: {}) {
    const curValue = toJS(subscribers.contents.items[_id])
    content = toJS(curValue ? Object.assign(curValue, { ... content }) : content)

    const doc = await collections.contents[_id ? 'upsert' : 'insert']({ ...content })
    if (!_id) _id = doc._id
    this.last = _id
  }

  sort (index) {
    const { criteria } = subscribers.contents
    const active = criteria.sort[`c${index}`] > 0
    criteria.sort = { [`c${index}`]: active ? -1 : 1 }
    console.log({ ...criteria.sort }, active)
  }

  increaseIndex () {
    subscribers.contents.criteria.index += 1
  }

  beforeDestroy () {
    console.error('why woudl this shit happen now')
    db.destroy()
  }

  get knownReadFormats () {
    return '.csv'
  }

  get searching () {
    return this.search.length > 0
  }
}
</script>

<style lang="stylus">
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

table
  background #f7f7f7
  padding 24px
  width auto

  th
  td
    padding 0
    margin 0
    position relative
    text-align left

  input
    border 0
    padding 0
    background transparent

    &+span
      position absolute
      left 0
      top 0
      bottom 0
      z-index 1
      cursor pointer

      headerfonts()

  tr
    &.new
      td
        background rgba(black, .05)
        input
          border 1px solid

    &.last
      td
        background green

thead
  th
    border-bottom 1px solid #aaa

    input
      headerfonts()
      margin-right 10px
      opacity 0

      &:hover
      &:focus
        opacity 1

        &+span
          opacity 0

tfoot
  tr
    td
      padding-top 24px

.import
  padding 20px
  border 1px solid
  margin-bottom 20px
</style>
