<script lang="ts">

import { Vue } from 'vue-property-decorator'
import { Address } from '@/common/formatter'
import { VNodeData } from 'vue'

export default Vue.extend({
    props: {
        icon: Boolean,
        abbrev: Boolean,
        size: Number,
        placeholder: String
    },
    render(h) {
        const data: VNodeData = {
            attrs: this.$attrs,
            on: this.$listeners,
        }

        if (!this.$slots.default) {
            data.domProps = { innerText: this.placeholder }
            return h('span', data)
        }
        const addr = (this.$slots.default[0].text || '').trim()
        if (!addr) {
            data.domProps = { innerText: this.placeholder }
            return h('span', data)
        }
        if (!Address.isValid(addr)) {
            data.domProps = { innerText: 'invalid address' }
            return h('span', data)
        }

        if (this.icon) {
            const size = this.size || 40
            data.domProps = { innerHTML: generateIconHtmlCached(addr, size) }
            data.style = {
                overflow: 'hidden',
                display: 'inline-block',
                width: size + 'px',
                height: size + 'px',
                'border-radius': '10%'
            }
            return h('div', data)
        } else {
            const checksumed = Address.toChecksum(addr)!
            if (this.abbrev) {
                data.domProps = { innerText: Address.abbrev(checksumed) }
            } else {
                data.domProps = { innerText: checksumed }
            }
            return h('span', data)
        }
    },
})


const jazzicon = require('jazzicon')

const cache: { [id: string]: string } = {}
function generateIconHtmlCached(addr: string, diameter: number) {
    // same as metamask
    let seed = 0
    try {
        seed = parseInt(addr.slice(0, 10), 16) || 0
    } catch {
    }

    const id = `${seed}:${diameter}`
    return cache[id] || (cache[id] = generateIcon(seed, diameter).outerHTML)
}

function generateIcon(seed: number, size: number) {
    const elem = (jazzicon(size, seed) as Element).firstElementChild!
    elem.removeAttribute('style')
    return elem
}

</script>
