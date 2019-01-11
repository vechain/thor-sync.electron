<template>
    <div style="display:inline-block">
        <span v-if="prepend">{{prepend}}</span>
        <span>{{parts[0]}}</span>
        <span style="font-size: 80%">{{parts[1]}}</span>
        <span
            v-if="sym"
            style="font-size: 60%;opacity: 0.6;white-space: pre;font-family: 'Roboto Mono', monospace"
        >{{sym}}</span>
    </div>
</template>
<script lang="ts">
import { Vue, Prop, Component } from 'vue-property-decorator'
import { Num } from '@/common/formatter'

@Component
export default class Amount extends Vue {
    @Prop({ type: Number, default: 2 }) dec!: number
    @Prop(String) sym!: string
    @Prop(String) prepend!: string

    slotContent = ''
    get parts() {
        return splitNum(this.slotContent, this.dec)
    }

    created() {
        this.extractSlot()
    }

    beforeUpdate() {
        this.extractSlot()
    }

    extractSlot() {
        this.slotContent = this.$slots.default[0] ? (this.$slots.default[0].text || '').trim() : ''
    }
}

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
