<template>
    <v-menu ref="menu" v-bind="$attrs" v-on="$listeners" v-model="opened" :close-on-click="false">
        <slot slot="activator" name="activator" />
        <slot />
    </v-menu>
</template>
<script lang="ts">
import { Vue, Component, Watch, Model } from 'vue-property-decorator'

@Component
export default class OverlayedMenu extends Vue {
    @Model('input') value!: boolean
    opened = false

    @Watch('value')
    valueChanged() {
        this.opened = this.value
    }

    @Watch('opened')
    openClose() {
        if (this.opened) {
            const menu = this.$refs['menu'] as any
            this.overlay.style.zIndex = (menu.styles.zIndex - 1) as any
            this.overlay.style.display = null
        } else {
            this.overlay.style.zIndex = null
            this.overlay.style.display = 'none'
        }
    }

    overlay = document.createElement('div')
    mounted() {
        this.overlay.className = 'sync-menu-overlay'
        this.overlay.style.display = 'none'
        this.overlay.onclick = () => {
            this.opened = false
        }
        document.body.appendChild(this.overlay)
    }
    destroyed() {
        this.overlay.parentNode!.removeChild(this.overlay)
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

