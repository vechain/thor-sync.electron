<template>
    <v-tooltip
        ref="vtt"
        v-bind="$attrs"
        v-on="$listeners"
        transition="fade-transition"
        open-delay="600"
    >
        <slot slot="activator" name="activator"/>
        <slot/>
    </v-tooltip>
</template>
<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'

@Component
export default class Toolip extends Vue {
    _unbind?: () => void

    mounted() {
        const vnode = this.$slots.activator[0]
        if (vnode && vnode.elm && vnode.elm.parentElement) {
            const elem = vnode.elm.parentElement
            const onClick = () => {
                // v-tooltip's method
                (this.$refs.vtt as any).clearDelay()
            }

            // set useCapture to true is important
            elem.addEventListener('click', onClick, true)
            this._unbind = () => {
                elem.removeEventListener('click', onClick, true)
            }
        }
    }

    destroyed() {
        if (this._unbind) {
            this._unbind()
        }
    }
}
</script>
