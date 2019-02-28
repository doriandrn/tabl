<template lang="pug">
#tableapp
  header
    .container__inner
      .logo.h1 tabl

  main
    .container__inner
      aside.tables
        button(@click="newTable") new table
        ul
          li(
            v-for= "table, id in items"
            @click= "active = id"
          ) {{ table.name || 'Untitled' }}

      nuxt

  footer
    .container__inner
      p footer
</template>

<script lang="ts">
import { Component, Vue } from 'nuxt-property-decorator'
import { reaction } from 'mobx'
import Subscriber from 'rxcollection-subscriber'
import { RxDatabase, RxCollection, create, plugin } from 'rxdb'

plugin(require('pouchdb-adapter-idb'))

@Component({})
export default class TableAppView extends Vue {
  tables = []
  active = ''
  items = {}
  ids = []
  length = -1

  newTable () {
    this.db.collections.datasets.insert({}).then(doc => {
      this.active = doc._id
    })
  }

  async beforeDestroy () {
    await this.db.destroy()
  }

  async mounted () {
    const cols = {
      categories: {
        name: 'categories',
        schema: {
          title: 'category',
          version: 0,
          type: 'object',
          properties: {
            name: {
              type: 'string'
            }
          }
        }
      },
      datasets: {
        name: 'datasets',
        schema: {
          title: 'dataset',
          version: 0,
          type: 'object',
          properties: {
            name: { type: 'string' },
            category: { ref: 'categories', type: 'string', index: true }
          }
        }
      },
      views: {
        name: 'views',
        schema: {
          title: 'view',
          version: 0,
          type: 'object',
          properties: {
            name: { type: 'string' },
            criteria: { type: 'object' },
            table: { ref: 'tables', type: 'string' }
          }
        }
      }
    }

    this.db = await create({
      name: 'tableapp',
      adapter: 'idb'
    })

    await Promise.all(Object.keys(cols).map(col => this.db.collection(cols[col])))

    const tablas = new Subscriber(this.db.collections.datasets)

    reaction(() => tablas.ids, () => {
      this.items = tablas.items
      this.ids = tablas.ids
      this.length = tablas.length
    })
  }
}
</script>


<style lang="stylus">
button
  border 0
  background transparent

#tableapp
  display flex
  flex-flow column nowrap
  min-height 100vh
  align-content flex-start

  .logo
    margin 0

  header
    flex 0 0 48px
    background white

  main
    flex 1 0 90%
    background #f7f6f8

  .dev
    margin-top auto

  header
    margin-bottom auto
    margin-top 0

  footer
    margin-top auto
</style>

