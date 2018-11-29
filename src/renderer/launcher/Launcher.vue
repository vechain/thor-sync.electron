<template>
    <div v-bind="$attrs" v-on="$listeners" style="background-color:#eaeaea">
        <div id="content"/>
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
        const path = hrefToPath(val)
        if (this.router.$route.path !== path) {
            this.router.$router.push(path)
        }
    }

    @Emit('update:status')
    updateStatus(status: WebView.Status) { }

    @Watch('router.$route.path')
    routed() {
        let path = this.router.$route.path
        if (path === '/') {
            this.updateHref('')
        } else {
            this.updateHref('sync:/' + path)
        }

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
        this.router.$router.push(hrefToPath(this.href || ''))
        this.routed()
    }
}

function hrefToPath(href: string) {
    if (href.startsWith('sync:/')) {
        return href.slice('sync:/'.length)
    }
    return href
}
</script>
