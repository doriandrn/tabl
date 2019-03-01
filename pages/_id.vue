<template lang="pug">
.hola
  data-table(
    v-if= "setdata._id === $route.params.id"
    :id=  "$route.params.id"
    :temporary= "false"
    :writePermissions = "true"
    @rename= "rename"
    :title= "setdata.name"
  )
</template>

<script lang="ts">
import { Component, Vue } from 'nuxt-property-decorator'
import DataTable from '~/components/DataTable'

let dataset

@Component({
  components: {
    DataTable
  }
})
export default class Dataset extends Vue {
  setdata = {
    name: undefined,
    _id: undefined
  }

  async asyncData ({ params, app }) {
    const { id } = params
    dataset = await app.$db.collections.datasets.findOne(id).exec()
    console.log('NFDS', dataset)
    const { _data } = dataset
    const setdata = Object.assign({}, { ..._data })
    return { setdata }
  }

  rename (newname) {
    dataset.atomicSet('name', newname)
  }

  destroy () {
    dataset = undefined
  }
}
</script>
