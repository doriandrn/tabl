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

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // if (!file.type.startsWith('image/')){ continue }

      // const img = document.createElement("img");
      // img.classList.add("obj");
      // img.file = file;
      // preview.appendChild(img); // Assuming that "preview" is the div output where the content will be displayed.

      const reader = new FileReader();
      reader.onload = (function(aImg) { return function(e) { aImg.src = e.target.result; }; })(img);
      reader.readAsDataURL(file);
    }

    await Promise.all(Object.keys(files).map(async filename => {
      const file = files[filename]
      const data = await csv().fromFile(file)
      console.log(filename, data)
    }))
    this.parsing = false
  }

  get knownReadFormats () {
    return formats.toString()
  }
}
</script>
