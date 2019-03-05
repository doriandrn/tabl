<template lang="pug">
#tableapp
  //- header
  //-   .container__inner
  //-     .logo.heading tabl

  main
    aside
      button(@click="newTable") new
      nav
        nuxt-link(
          v-for=  "table, id in items"
          :key=   "id"
          :to=    "`/${id}`"
        ) {{ table.title || `Untitled ${ids.indexOf(id) + 1}` }}
          span.count {{ table.total }}

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
  _subscriber = undefined

  newTable () {
    this.$db.collections.datasets.insert({}).then(doc => {
      this.$router.replace({ path: `/${doc._id}` })
    })
  }

  async beforeDestroy () {
    this._subscriber.kill()
    await this.$db.destroy()
  }

  beforeCreate () {
    this._subscriber = new Subscriber(this.$db.collections.datasets)
  }

  async mounted () {
    reaction(() => this._subscriber.items, () => {
      console.info('shit updated')
      this.items = this._subscriber.items
      this.ids = this._subscriber.ids
      this.length = this._subscriber.length
    })
  }
}
</script>


<style lang="stylus">
@require '~assets/styles/base'

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
    margin-bottom auto
    margin-top 0

    @media print
      display none

  main
    max-width 100%
    flex 1 0 100%

  .dev
    margin-top auto

  footer
    margin-top auto

    @media print
      display none


  aside
    position fixed 0 auto 0 0
    padding 32px
    text-align: right;
    background: pal.bg

    a:not(.active):not(:focus):not(:hover)
      color #aaa
    
    @media print
      display none

    +above(xl)
      max-width: 210px;
      margin-right: 32px;
      border-right 1px solid rgba(black, .05)

      &+div
        margin-left 210px
        margin-right 12px

    nav
      margin-top 20px
      
      a
        display inline-block
        margin 4px

        +above(xl)
          display block

</style>

