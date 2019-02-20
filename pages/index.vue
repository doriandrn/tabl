<template lang="pug">
//- p(v-if="loading") loading
section.file-table
  data-table

  .dev(v-if="isDev")
    h1 dev shit
    label(for="viewOnly") view only
    input(type="checkbox" name="viewOnly")

    button() add header
    button() add data row
</template>

<script lang="ts">
import { Component, Vue } from 'nuxt-property-decorator'
import DataTable from '~/components/DataTable'

const env = process.env.NODE_ENV

@Component({
  components: {
    DataTable
  }
})
export default class Zable extends Vue {
  loading = true

  get isDev () {
    return env === 'development'
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
    max-width 90%
    margin 0 auto

section
  margin 40px 0

.meta
  font-size 13px
  color #666

.dev
  background teal
  > *
    margin 10px
</style>
