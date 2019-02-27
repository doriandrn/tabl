const { NODE_ENV } = process.env

module.exports = {
  /*
  ** Headers of the page
  */
  head: {
    title: 'datatablez',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: 'Datatable' }
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
    ]
  },
  /*
  ** Customize the progress bar color
  */
  loading: { color: '#3B8070' },
  mode: 'spa',

  router: {
    base: NODE_ENV === 'production' ? '/' : undefined,
    fallback: true,
    linkActiveClass: 'active',
    linkExactActiveClass: 'active-exact'
  },

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
    }
  }
}

