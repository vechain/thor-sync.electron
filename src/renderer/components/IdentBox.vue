<template>
    <div v-bind="$attrs" v-on="$listeners" :style="styleObject">
        <slot/>
    </div>
</template>
<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
import { generate } from '@/common/ident-svg'
import * as LRU from 'lru-cache'

@Component
export default class IdentBox extends Vue {
    @Prop(String) text !: string

    get styleObject() {
        const text = this.text || ''
        let svg = cache.get(text)
        if (!svg) {
            svg = generate(text)
            cache.set(text, svg)
        }
        return {
            background: `no-repeat url('data:image/svg+xml;utf8,${svg}')`,
            'background-size': 'cover'
        }
    }
}

const cache = new LRU<string, string>(100)
</script>
