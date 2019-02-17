<template lang="pug">
  section.file-table
    input(placeholder="zable title")
    p(v-if="loading") loading
    table.data-table(v-else)
      thead
        th(v-for="i in 3 + 1")
          input(@change="setHeader(i, $event.target.value)")
        th
          input
      tbody
        tr
          td
            input
          td
            input

</template>

<script lang="ts">
import { observable, reaction } from 'mobx'
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
          ref: 'headers',
          // primary: true,
          type: 'string',
          index: true
        },
        content: { type: 'string' }
      },
      required: ['header']
    }
  }
}

let colsCount: number = 0
let collections: { [k: string]: RxCollection } = {}
let db: RxDatabase

@Component({
  props: {}
})
export default class Zable extends Vue {
  loading = true
  headers = []
  contents = []

  async asyncData () {

    db = await create({
      name: `zable_${Date.now()}`,
      adapter: 'memory',
      ignoreDuplicate: true
    })

    await Promise.all(Object.keys(cols).map(col => db.collection(cols[col])))

    collections = db.collections
    window.db = db
  }

  mounted () {
    this.loading = false
    const { headers, contents } = collections

    const headersMain = new Subscriber(headers)
    window.headersMain = headersMain
    window.contentsMain = new Subscriber(contents)

    reaction(() => ({ ...headersMain.ids }), (ids) => {
      console.log('newids', ids)
      this.headers = headersMain.ids
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

