<template>
    <div style="height:100%; width:100%;overflow:auto;">
        {{path}}
        <div id="content">
        </div>
    </div>
</template>
<script lang="ts">
import { Vue, Component, Prop, Watch, Model } from 'vue-property-decorator'
import Router from './Router.vue'
import router from '@/dapps/api/router';

interface ILauncher {
    goBack(): void
    goForward(): void
    reload(): void
}

@Component
export default class Launcher extends Vue implements ILauncher {
    @Model('nav') path!: string

    @Watch('path')
    navTo() {
        if (this.router.$route.path !== this.path) {
            this.router.$router.push(this.path)
        }
    }

    @Watch('content.$route.path')
    routed() {
        if (this.router.$route.path !== this.path) {
            this.$emit('nav', this.router.$route.path)
        }
    }

    router = Router.create(this)

    goBack() {
        this.router.$router.back()
    }
    goForward() {
        this.router.$router.forward()
    }

    reload() {}

    mounted() {
        this.router.$mount('#content')
        if (this.path) {
            this.navTo()
        } else {
            this.routed()
        }
    }
}
</script>
