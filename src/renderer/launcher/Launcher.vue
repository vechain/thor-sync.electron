<template>
    <div>
        {{path}}
        <div id="content">
        </div>
    </div>
</template>
<script lang="ts">
import { Vue, Component, Prop, Watch, Model } from 'vue-property-decorator'
import Router from './Router.vue'


@Component
export default class Launcher extends Vue {
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
