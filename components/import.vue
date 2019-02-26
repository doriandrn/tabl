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

    const reader = new FileReader();

    await Promise.all(Object.keys(files).map(async filename => {
      const file = files[filename]

      reader.onloadstart = (e) => {
        this.parsing = true
      }
      reader.onloadend = async (e) => {
        const data = await csv().fromString(e.target.result)
        let keys

        data.map(item => {
          if (!keys) {
            keys = Object.keys(item)
            keys.map((header, i) => this.$emit('header', { i, header }))
          }

          this.$emit('content', Object.assign({}, ... Object.values(item).map((val, index) => ({ [`c${index + 1}`]: val })) ))
        })

        this.parsing = false
      }

      reader.readAsText(file)
    }))
    this.parsing = false
  }

  get knownReadFormats () {
    return formats.toString()
  }
}
</script>
