<script lang="ts">
import { Vue } from 'vue-property-decorator'
const QRious = require('qrious')
import { Address } from '@/common/formatter'

export default Vue.extend({
    props: {
        pre: Boolean,
        size: Number
    },
    render(h) {
        let content = ''
        if (this.$slots.default) {
            content = this.$slots.default[0].text || ''
        }
        if (!this.pre) {
            content = content.trim()
            if (Address.isValid(content)) {
                content = Address.toChecksum(content)!
            }
        }
        const size = this.size || 100

        return h('div', {
            attrs: this.$attrs,
            on: this.$listeners,
            style: {
                display: 'inline-block',
                width: size + 'px',
                height: size + 'px',
            },
            domProps: {
                innerHTML: generateQRHtml(content, size)
            }
        })
    }
})

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
