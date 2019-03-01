<template lang="pug">
.hola
  data-table(
    :id=  "$route.params.id"
    :temporary= "false"
    :writePermissions = "true"
    @rename= "rename"
  )
</template>

<script lang="ts">
import { Component, Vue } from 'nuxt-property-decorator'
import DataTable from '~/components/DataTable'

@Component({
  components: {
    DataTable
  }
})
export default class Dataset extends Vue {
  rename () {
    console.log('munte')
  }
}
</script>
