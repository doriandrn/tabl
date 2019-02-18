<template lang="pug">
  section.file-table
    input(placeholder="zable title")
    p(v-if="loading") loading
    table.data-table(v-else)
      thead
        th(v-for="i in headers.length + 1")
          input(
            @change=  "setHeader(i, $event.target.value)"
            :value=   "headersVals[i - 1]"
          )
      tbody
        tr(v-for="j in contents.length + 1")
          td(v-for="i in headers.length + 1")
            input(
              @change= "setContent(j, { [i - 1]: $event.target.value })"
              :value=  "contentsVals[j - 1] ? contentsVals[j - 1][i - 1] : undefined"
            )
    p {{ headers.length }}
</template>

<script lang="ts">
import { observable, reaction, toJS } from 'mobx'
import { Observer } from 'mobx-vue'
import { Component, Vue } from 'nuxt-property-decorator'
import Subscriber from 'rxcollection-subscriber'
import { RxDatabase, RxCollection, create, plugin } from 'rxdb';

plugin(require('pouchdb-adapter-memory'))

const env = process.env.NODE_ENV

const cols = {
  headers: {
    name: 'headers',
    schema: {
      title: 'header',
      version: 0,
      type: 'object',
      properties: {
        index: {
          type: 'string',
          primary: true
        },
        name: { type: 'string' }
      },
      required: ['index', 'name']
    }
  },
  contents: {
    name: 'contents',
    schema: {
      title: 'item',
      version: 0,
      type: 'object',
      properties: {
        header: {
          // ref: 'headers',
          primary: true,
          type: 'string',
          // index: true
        },
        content: { type: 'object' }
      },
      required: ['header']
    }
  }
}

let colsCount: number = 0
let collections: { [k: string]: RxCollection } = {}
let db: RxDatabase
const subscribers = {}

@Component({
  props: {},
  computed: {
    headersVals () {
      return this.headers.ids.map(id => this.headers.items[Number(id)].name)
    },
    contentsVals () {
      return this.contents.ids.map(id => this.contents.items[Number(id)].content)
    }
  }
})
export default class Zable extends Vue {
  loading = true
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

  async asyncData () {

    db = await create({
      name: `zable_${Date.now()}`,
      adapter: 'memory',
      ignoreDuplicate: true
    })

    await Promise.all(Object.keys(cols).map(col => db.collection(cols[col])))

    collections = db.collections
    if (env === 'dev') {
      window.db = db
      window.subscribers = subscribers
    }
  }

  mounted () {
    this.loading = false

    subscribers.headers = new Subscriber(collections.headers)
    subscribers.contents = new Subscriber(collections.contents)

    const { headers, contents } = subscribers

    reaction(() => [...headers.ids], () => {
      this.headers.items = headers.items
      this.headers.ids = headers.ids
      this.headers.length = headers.length
    })

    reaction(() => [...contents.ids], () => {
      this.contents.items = contents.items
      this.contents.ids = contents.ids
      this.contents.length = contents.length
    })
  }

  beforeDestroy () {
    db.destroy()
  }

  setHeader (index: number, value: string) {
    collections.headers.upsert({
      name: value,
      index: String(index)
    })
  }

  async setContent (index, content: {}) {
    // await subscribers.contents.updates
    const curValue = toJS(subscribers.contents.items[String(index)])
    content = toJS(curValue && curValue.content ? Object.assign(curValue.content, { ... content }) : content)
    console.info(curValue, content)

    await collections.contents.upsert({
      header: String(index),
      content
    })

    // await subscribers.contents.updates
  }
}
</script>

<style>
.container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
}

.title {
  font-family: "Quicksand", "Source Sans Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; /* 1 */
  display: block;
  font-weight: 300;
  font-size: 100px;
  color: #35495e;
  letter-spacing: 1px;
}

.subtitle {
  font-weight: 300;
  font-size: 42px;
  color: #526488;
  word-spacing: 5px;
  padding-bottom: 15px;
}

.links {
  padding-top: 15px;
}
</style>

