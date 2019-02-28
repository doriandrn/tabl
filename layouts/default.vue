<template lang="pug">
#tableapp
  header
    .container__inner
      h1 tabl

  main
    .container__inner
      aside.tables
        ul
          li blabla
      nuxt

  footer
    .container__inner
      p footer
</template>

<style lang="stylus">
html {
  font-family: "Source Sans Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  font-size: 16px;
  word-spacing: 1px;
  -ms-text-size-adjust: 100%;
  -webkit-text-size-adjust: 100%;
  -moz-osx-font-smoothing: grayscale;
  -webkit-font-smoothing: antialiased;
  box-sizing: border-box;
}

input {
  font-size 15px
  line-height 24px
}

*, *:before, *:after {
  box-sizing: border-box;
  margin: 0;
}

button
  border 0
  background transparent

#tableapp
  display flex
  flex-flow column nowrap
  min-height 100vh
  align-content flex-start

  header
    flex 0 0 48px
    background white

  main
    flex 1 0 90%
    background #f7f6f8

  .dev
    margin-top auto

  header
    margin-bottom auto
    margin-top 0

  footer
    margin-top auto
</style>

