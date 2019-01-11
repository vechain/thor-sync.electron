
<template>
    <div :style="{width:size+'px',height:size+'px'}" v-html="html"></div>
</template>
<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
const QRious = require('qrious')
import { Address } from '@/common/formatter'

@Component
export default class QRCode extends Vue {

    @Prop(Boolean) pre!: boolean
    @Prop(Number) size!: number

    slotContent = ''

    get html() {
        let content
        if (this.pre) {
            content = this.slotContent
        } else {
            content = this.slotContent.trim()
            if (Address.isValid(content)) {
                content = Address.toChecksum(content)!
            }
        }
        return generateQRHtml(content, this.size || 100)
    }

    created() {
        this.extractSlot()
    }
    beforeUpdate() {
        this.extractSlot()
    }

    extractSlot() {
        this.slotContent = this.$slots.default[0] ? (this.$slots.default[0].text || '') : ''
    }
}

const qr = new QRious()
function generateQRHtml(content: string, size: number) {
    qr.value = content
    qr.size = size * 2

    const img = qr.image as HTMLElement
    img.style.width = '100%'
    img.style.height = '100%'
    return img.outerHTML
}

</script>
