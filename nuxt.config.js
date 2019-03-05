// const { NODE_ENV } = process.env
const stylusPlugins = [
  require('rupture')()
]

module.exports = {
  /*
  ** Headers of the page
  */
  head: {
    title: 'tabl',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: 'Datatable' }
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
    ],
    bodyAttrs: {
      spellcheck: 'false'
    }
  },
  /*
  ** Customize the progress bar color
  */
  loading: { color: '#000000' },
  css: [{
    src: '~assets/styles/index.styl',
    lang: 'stylus'
  }],
  mode: 'spa',

  router: {
    // base: NODE_ENV === 'production' ? '/' : undefined,
    // fallback: true,
    linkActiveClass: 'active',
    linkExactActiveClass: 'active-exact'
  },
  plugins: [
    { src: '~plugins/db' }
  ],
  /*
  ** Build configuration
  */
  build: {

    /*
    ** Run ESLint on save
    */
    extend (config, { isDev, isClient }) {
      config.node = {
        fs: 'empty'
      }

      // add plugins to stylus
      const stylLoader = config.module.rules.filter(module => String(module.test).indexOf('styl') > -1)[0]

      stylLoader.oneOf.forEach(one => {
        const module = one.use.filter(o => o.loader === 'stylus-loader')[0]
        if (!module) return
        module.options.context = __dirname
        Object.assign(module.options, {
          use: stylusPlugins,
          preferPathResolver: 'webpack'
        })
      })
    }
  }
}

