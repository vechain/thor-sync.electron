<template>
    <div v-bind="$attrs" v-on="$listeners" :style="styleObject">
        <slot/>
    </div>
</template>
<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
import { picasso } from '@vechain/picasso'
import * as LRU from 'lru-cache'

@Component
export default class IdentBox extends Vue {
    @Prop(String) text !: string

    get styleObject() {
        const text = this.text || ''
        let svg = cache.get(text)
        if (!svg) {
            svg = picasso(text)
            cache.set(text, svg)
        }
        return {
            'background-image': `url('data:image/svg+xml;utf8,${svg}')`,
            'background-size': 'cover',
            'background-repeat': 'no-repeat'
        }
    }
}

const cache = new LRU<string, string>(100)
</script>
