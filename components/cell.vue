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

td(
  :class= "{ focusing }"
  @click= "focus"
)
  div(
    :contentEditable = "editable"
    @blur = "emitChange($event)"
    @focus= "focusing = true"
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
  focusing = false

  emitChange ($event) {
    this.focusing = false
    if (this.value === $event.target.textContent) return
    this.$emit('change', $event.target.textContent)
  }

  focus () {
    if (this.focusing) return
    const ceDiv = this.$el.querySelector('div[contenteditable]')
    if (!ceDiv) return
    ceDiv.focus()
  }
}
</script>

<style lang="stylus">
@require '~assets/styles/base'

td
  background white

  &.focusing
    border-color: pal.secondary !important

  > div[contenteditable]
    margin -1px
    padding 4px 8px
    line-height 20px
    height 100%
    outline none
    border 1px solid transparent
    transition all .1s ease-in-out

    &:focus
      color black
</style>
