<template lang="pug">
form.import
  label(for="import")
    h2 Import {{ noHeaders ? 'with no headers' : '' }}
  input(
    type="file"
    name="import"
    :accept="knownReadFormats"
    multiple
    @change= "parseFiles"
  )

  p.meta known formats: {{ knownReadFormats }}
  p(v-if="parsing") parsing
</template>

<script lang="ts">
import { Component, Vue } from 'nuxt-property-decorator'
import csv from 'csvtojson'
import Papa from 'papaparse'

function dragenter(e) {
  e.stopPropagation()
  e.preventDefault()
}

function dragover(e) {
  e.stopPropagation()
  e.preventDefault()
}

function drop(e) {
  e.stopPropagation()
  e.preventDefault()

  const dt = e.dataTransfer
  const files = dt.files

  this.parseFiles(files)
}

const formats = ['.csv']

@Component({
  props: {
    noHeaders: {
      type: Boolean,
      default: false
    }
  }
})
export default class Importer extends Vue {
  parsing = false

  mounted () {
    this.$el.addEventListener("dragenter", dragenter, false);
    this.$el.addEventListener("dragover", dragover, false);
    this.$el.addEventListener("drop", drop, false);
  }

  async parseFiles (e) {
    this.parsing = true
    const { files } = e.target

    console.info('F', files)

    Object.keys(files).map(filename => {
      let i = -1
      Papa.parse(files[filename], {
        skipEmptyLines: true,
        step: (results) => {
          const { data } = results // a row
          // headers
          i += 1
          if (i === 0) {
            data[0].map((header, hi) => this.$emit('header', { i: hi + 1, header }))
            return
          }
          this.$emit('rowcontent', data[0])
        },

        chunk: (chunk) => {

        },

        complete: (results, file) => {
          const { size } = file
          this.$emit('parsed', { i, size })
          this.parsing = false
        }
      })
    })

    // const reader = new FileReader();

    // await Promise.all(Object.keys(files).map(async filename => {
    //   const file = files[filename]

    //   reader.onloadstart = (e) => {
    //     this.parsing = true
    //   }
    //   reader.onloadend = async (e) => {
    //     const data = await csv().fromString(e.target.result)
    //     let keys

    //     data.map(item => {
    //       if (!keys) {
    //         keys = Object.keys(item)
    //         keys.map((header, i) => this.$emit('header', { i, header }))
    //       }

    //       this.$emit('content', Object.assign({}, ... Object.values(item).map((val, index) => ({ [`c${index + 1}`]: val })) ))
    //     })

    //     this.parsing = false
    //   }

    //   reader.readAsText(file)
    // }))
    // this.parsing = false
  }

  get knownReadFormats () {
    return formats.toString()
  }
}
</script>
