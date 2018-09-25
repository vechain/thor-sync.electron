<template>
    <div class="identicon" v-html="iconHTML" :style="{width:size + 'px', height:size+'px'}">
    </div>
</template>
<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'

@Component
export default class IdentIcon extends Vue {
    @Prop({ default: 40 }) size!: number
    @Prop(String) address!: string

    get iconHTML() {
        return generateIconHtmlCached(this.address, this.size)
    }
}

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
function generateIcon(seed: number, diameter: number) {
    const elem = (jazzicon(diameter, seed) as Element).firstElementChild!
    // remove buggy style
    elem.attributes.removeNamedItem('style')
    return elem
}
</script>
<style lang="scss">
.identicon {
  overflow: hidden;
}
</style>
