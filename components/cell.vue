<template lang="pug">
// td
//   textarea(
//     v-if=     "editable"
//     @change = "$emit('input', $event)"
//     @click=   "$emit('click')"
//     :value=   "value"
//     rows= 1
//   )
//   span(v-else) {{ value }}

td
  div(
    :contentEditable = "editable"
    @blur = "emitChange($event)"
    v-text= "value"
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
  async emitChange ($event) {
    if (this.value === $event.target.textContent) return
    await this.$emit('change', $event.target.textContent)
    // $event.target.textContent = ''
  }
}
</script>

<style lang="stylus">
td
  > div
    padding 8px
    outline none
</style>
