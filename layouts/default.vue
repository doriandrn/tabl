<template lang="pug">
#tableapp
  header
    .container__inner
      .logo.heading tabl

  main
    .container__inner
      aside.tables
        button(@click="newTable") new table
        nav
          nuxt-link(
            v-for= "table, id in items"
            :key= "id"
            :to=  "`/${id}`"
            :class= "{ active: active === id }"
          ) {{ table.name || `Untitled ${ids.indexOf(id) + 1}` }}

      nuxt(:active= "active")

  footer
    .container__inner
      p footer
</template>

<script lang="ts">
import { Component, Vue } from 'nuxt-property-decorator'
import { reaction } from 'mobx'
import Subscriber from 'rxcollection-subscriber'

@Component({})
export default class TableAppView extends Vue {
  tables = []
  active = ''
  items = {}
  ids = []
  length = -1

  newTable () {
    this.$db.collections.datasets.insert({}).then(doc => {
      this.active = doc._id
    })
  }

  async beforeDestroy () {
    await this.$db.destroy()
  }

  async mounted () {
    const tablas = new Subscriber(this.$db.collections.datasets)

    reaction(() => tablas.ids, () => {
      this.items = tablas.items
      this.ids = tablas.ids
      this.length = tablas.length
    })
  }
}
</script>


<style lang="stylus">
.container
  min-height 100vh
  display flex
  justify-content: center;
  align-items: center;
  text-align: center;

  &__inner
    max-width 100%
    margin 0 auto
    display flex
    flex-flow row wrap
    padding 0 4px

    +above(m)
      padding 0 8px

    +above(l)
      padding 0 12px

    +above(xl)
      padding 0 16px

    +desktop()
      padding 0 20px

section
  margin 40px 0

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
    max-width 100%
    flex 1 0 100%

  .dev
    margin-top auto

  header
    margin-bottom auto
    margin-top 0

  footer
    margin-top auto


  aside
    padding 32px
    padding-left 0
    text-align: right;
    border-right 1px solid rgba(black, .05)
    background yellow
    width 100%

    +above(xl)
      max-width: 210px;
      margin-right: 32px;

    nav
      margin-top 20px
      
      a
        display inline-block
        margin 4px

</style>

