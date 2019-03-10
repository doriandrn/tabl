<template lang="pug">
.resize(
  :style= "height"
  :class= "{ resizing: resizing > 0 }"
)
</template>

<script lang="ts">
import { Component, Vue } from 'nuxt-property-decorator'

let initedListeners = false
let pageX, curCol, nxtCol, curColWidth, nxtColWidth

@Component({
  props: {
    height: {
      type: String
    }
  }
})
export default class resize extends Vue {
  resizing = -1

  mounted () {
    this.$el.addEventListener('mousedown', (e) => {
      this.resizing = 0
      curCol = e.target.parentElement
      nxtCol = curCol.nextElementSibling
      pageX = e.pageX

      var padding = 0

      curColWidth = curCol.offsetWidth - padding;
      if (nxtCol)
      nxtColWidth = nxtCol.offsetWidth - padding;
    })

    if (initedListeners)
      return

    document.addEventListener('mousemove', (e) => {
      if (curCol) {
        var diffX = e.pageX - pageX

        if (nxtCol)
          nxtCol.style.width = (nxtColWidth - (diffX)) + 'px'

        curCol.style.width = (curColWidth + diffX) + 'px'
      }
      if (this.resizing === 0)
        this.resizing = 1
    })

    document.addEventListener('mouseup', (e) => {
      this.resizing = -1
      curCol = undefined;
      nxtCol = undefined;
      pageX = undefined;
      nxtColWidth = undefined;
      curColWidth = undefined
    })

    initedListeners = true
  }
}
</script>

<style lang="stylus">
th
  .resize
    position absolute
    width 3px
    right -1px
    top 0
    bottom 0
    background transparent

    &.resizing
    &:hover
      cursor col-resize
      background black
</style>
