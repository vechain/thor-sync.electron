<script lang="ts">

import { Vue } from 'vue-property-decorator'
import { Num } from '@/common/formatter'

export default Vue.extend({
    props: {
        dec: {
            type: Number,
            default: 3
        },
        sym: String,
        prepend: String
    },
    render(h) {
        if (!this.$slots.default) {
            return h('span')
        }

        const numStr = (this.$slots.default[0].text || '').trim()
        const parts = splitNum(numStr, this.dec)

        const children = [
            h('span', {
                domProps: {
                    innerText: parts[0]
                }
            }),
            h('span', {
                style: {
                    'font-size': '80%'
                },
                domProps: {
                    innerText: parts[1]
                }
            }),
        ]
        if (this.prepend) {
            children.unshift(h('span', {
                domProps: {
                    innerText: this.prepend
                }
            }))
        }
        if (this.sym) {
            children.push(h('span', {
                style: {
                    'font-size': '60%',
                    'opacity': 0.6,
                    'white-space': 'pre'
                },
                domProps: {
                    innerText: this.sym
                }
            }))
        }

        return h('div', {
            attrs: this.$attrs,
            on: this.$listeners,
            style: {
                "display": "inline-block",
                'font-family': '"Roboto Mono", monospace'
            }
        }, children)
    },
})


// split number string into integer part and decimal part
function splitNum(numStr: string | null, decimal: number) {
    if (!numStr) {
        return ['--', '.--']
    }
    numStr = Num.formatBalance(numStr, decimal)
    if (numStr === 'NaN') {
        return ['--', '.--']
    }
    const dp = numStr.indexOf('.')
    if (dp >= 0) {
        return [numStr.slice(0, dp), numStr.slice(dp)]
    } else {
        return [numStr, '']
    }
}
</script>
