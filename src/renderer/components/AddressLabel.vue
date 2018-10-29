<script lang="ts">

import { Vue } from 'vue-property-decorator'
import { Address } from '@/common/formatter'
import { VNodeData } from 'vue'
import IdentBox from './IdentBox.vue'

export default Vue.extend({
    components: {
        IdentBox
    },
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
            const size = this.size || 36
            data.props = { text: addr.toLowerCase() }
            data.style = {
                display: 'inline-block',
                width: size + 'px',
                height: size + 'px',
                'border-radius': '4%'
            }
            return h('IdentBox', data)
        } else {
            const checksumed = Address.toChecksum(addr)!
            if (this.abbrev) {
                data.domProps = { innerText: Address.abbrev(checksumed) }
            } else {
                data.domProps = { innerText: checksumed }
            }
            data.style = {
                'font-family': '"Roboto Mono", monospace'
            }
            return h('span', data)
        }
    },
})
</script>
