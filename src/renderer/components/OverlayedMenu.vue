<template>
    <v-menu
        ref="menu"
        v-bind="$attrs"
        v-on="$listeners"
        :close-on-click="false"
        :value="value"
        @input="$emit('input', $event)"
    >
        <slot slot="activator" name="activator"/>
        <slot/>
    </v-menu>
</template>
<script lang="ts">
import { Vue, Component, Watch, Prop } from 'vue-property-decorator'

@Component
export default class OverlayedMenu extends Vue {
    @Prop(Boolean) value !: boolean

    @Watch('value')
    valueChanged() {
        if (this.value) {
            const menu = this.$refs['menu'] as any
            this.overlay.style.zIndex = (menu.styles.zIndex - 1) as any
            this.overlay.style.display = ''
        } else {
            this.overlay.style.zIndex = ''
            this.overlay.style.display = 'none'
        }
    }

    overlay!: HTMLElement

    mounted() {
        this.overlay = document.createElement('div')
        this.overlay.className = 'sync-menu-overlay'
        this.overlay.style.display = 'none'
        this.overlay.onclick = () => {
            this.$emit('input', false)
        }
        document.body.appendChild(this.overlay)
    }
    destroyed() {
        document.body.removeChild(this.overlay)
    }
}
</script>
<style>
.sync-menu-overlay {
  position: fixed;
  left: 0px;
  top: 0px;
  width: 100vw;
  height: 100vh;
}
</style>
