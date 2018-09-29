<template>
    <div v-html="qrHTML" :style="{width: this.qrsize + 'px', height: this.qrsize + 'px'}">
    </div>
</template>
<script lang="ts">
import { Vue, Prop, Component, Watch } from 'vue-property-decorator'
const QRious = require('qrious')

@Component
export default class QRCode extends Vue {
    @Prop([Number, String]) size!: number
    @Prop(String) content!: string

    readonly qr = new QRious()

    get qrsize() {
        return (this.size || 100)
    }

    get qrHTML() {
        this.qr.size = this.qrsize * 2
        this.qr.value = this.content
        return this.qr.image.outerHTML
    }
}
</script>
<style lang="css" scoped>
div {
  display: inline-block;
}
div >>> img {
  width: 100%;
  height: 100%;
}
</style>

