<template lang="pug">
//- p(v-if="loading") loading
.file-table
  p homepage stuff, welcome, guides, how to start, shit like dis, drag n drop filez

  .dev(v-if="isDev")
    h1 DEV
    label(for="viewOnly") write permissions
    input(type="checkbox" name="viewOnly" v-model="writePermissions")

    button() add header
    button() add data row
</template>

<script lang="ts">
import { Component, Vue } from 'nuxt-property-decorator'
import DataTable from 'c/DataTable'

const env = process.env.NODE_ENV

@Component({
  components: {
    DataTable
  }
})
export default class Zable extends Vue {
  loading = true
  writePermissions = false

  get isDev () {
    return env === 'development'
  }
}
</script>

<style lang="stylus">
.meta
  font-size 13px
  color #666

.dev
  padding 30px
  background rgba(teal, .1)
  > *
    margin 10px
</style>
