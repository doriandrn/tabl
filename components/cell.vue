<template lang="pug">
td
  input(
    @change = "$emit('input', $event)"
    :value=   "value"
  )
</template>

<script lang="ts">
import { Component, Vue } from 'nuxt-property-decorator'

@Component({
  props: {
    reference: {
      type: String
    },
    value: {
      type: String,
      default: ''
    },
    editable: {
      type: Boolean,
      default: true
    },
    clearable: {
      type: Boolean,
      default: true
    }
  }
})
export default class Cell extends Vue {
}
</script>
