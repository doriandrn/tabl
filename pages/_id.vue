<template lang="pug">
.yolo
  //- data-table(
  //-   v-if=         "doc && doc._id === id"
  //-   :id=          "id"
  //-   :temporary=   "false"
  //-   :writePermissions = "true"
  //-   @rename=      "title = $event"
  //-   :title=       "doc.title"
  //-   :totalCount=  "total"
  //-   @newTotal=    "total = $event"
  //- ) {{ total }}
</template>

<script lang="ts">
import { Component, Vue } from 'nuxt-property-decorator'
import DataTable from '~/components/DataTable'

let doc

@Component({
  components: {
    DataTable
  },
  computed: {
    id () {
      return this.$route.params.id
    }
  }
})
export default class Dataset extends Vue {
  doc = {
    title: '',
    _id: null,
    _rev: undefined,
    total: -1
  }

  get title () {
    return (this.doc.title) || ''
  }

  set title (newTitle) {
    this.doc.atomicSet('title', newTitle)
  }

  get total () {
    return (this.doc.total) || -1
  }

  set total (newVal: number) {
    this.doc.atomicSet('total', newVal)
    // doc.total = newVal
  }

  async mounted () {
    doc = await this.$db.collections.datasets.findOne(this.id).exec()
    this.doc = Object.seal(doc)
  }

  destroy () {
    this.doc = undefined
  }
}
</script>
