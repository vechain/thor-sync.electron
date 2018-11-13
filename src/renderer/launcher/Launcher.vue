<template>
    <div v-bind="$attrs" v-on="$listeners">
        <div id="content" style="width:100%;height:100%"></div>
    </div>
</template>
<script lang="ts">
import { Vue, Component, Prop, Watch, Model, Emit } from 'vue-property-decorator'
import Router from './Router.vue'


@Component
export default class Launcher extends Vue {
    readonly router = Router.create(this)

    @Prop(String) href!: string
    @Emit("update:href")
    updateHref(val: string) { }

    @Watch('href')
    hrefChanged(val: string) {
        if (val.startsWith('sync:/')) {
            val = val.slice('sync:/'.length)
        }
        if (this.router.$route.path !== val) {
            this.router.$router.push(val)
        }
    }

    @Emit('update:status')
    updateStatus(status: WebView.Status) { }

    @Watch('router.$route.path')
    routed() {
        let href = this.router.$route.path
        if (href === '/') {
            href = ''
        } else {
            href = 'sync:/' + href
        }
        this.updateHref(href)

        const history = this.router.$router.history
        this.updateStatus({
            title: (this.router.$route.meta || {}).title || '',
            favicon: '',
            progress: 1,
            canGoBack: history.index !== 0,
            canGoForward: history.index < history.stack.length - 1,
            cert: null
        })
    }
    @Prop(Object) nav!: WebView.Nav
    @Watch('nav.goBack')
    goBack() { this.router.$router.back() }
    @Watch('nav.goForward')
    goForward() { this.router.$router.forward() }
    // @Watch('nav.reloadOrStop')   

    mounted() {
        this.router.$mount('#content')
        if (this.href) {
            this.router.$router.push(this.href)
        } else {
            this.router.$router.push('/')
        }
        this.routed()
    }
}
</script>
