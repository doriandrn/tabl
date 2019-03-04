<template lang="pug">
.progress.ui
  .bar(:style= "{ animationDuration: `${eta}s` }")
    .shadow
</template>

<script>
export default {
  props: {
    eta: {
      type: Number
    },
    percentage: {
      type: Number
    }
  }
}
</script>

<style lang="stylus">
colors = {
  green: #4cd964
  turquoise: #5ac8fa
  blue: #007aff
  lightBlue: #34aadc
  purple: #5856d6
  red: #ff2d55
}

.progress
  width 260px
  max-width 100%
  height 4px
  position relative

  .bar
    animation-name: width
    background-image: linear-gradient(to right, colors.green, colors.turquoise, colors.blue, colors.lightBlue, colors.purple, colors.red)
    background-size 260px 4px
    height 100%
    position relative

  .shadow
    background-image linear-gradient(to bottom, #eaecee, transparent)
    height 4em
    position absolute
    top 100%
    transform skew(45deg)
    transform-origin 0 0
    width 100%


@keyframes width {

  0%, 100% {
    transition-timing-function: cubic-bezier(1, 0, .65, .85);
  }

  0% {
    width: 0;
  }

  100% {
    width: 100%;
  }

}

</style>
