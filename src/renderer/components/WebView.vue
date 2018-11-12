<template>
    <div v-bind="$attrs" v-on="$listeners">
        <webview
            ref="webview"
            :partition="partition"
            :preload="preload"
            style="width:100%;height:100%;"
            :style="{opacity:(loading || domReady) ?'inherit':'hidden'}"
        />
    </div>
</template>
<script lang="ts">
import { Vue, Component, Prop, Emit, Watch } from 'vue-property-decorator'
import { WebviewTag, PageFaviconUpdatedEvent, NewWindowEvent, PageTitleUpdatedEvent, LoadCommitEvent } from 'electron'

@Component
export default class WebView extends Vue {
    readonly partition = `persist:${connex.thor.genesis.id}`
    readonly preload = ENV.preload

    domReady = false
    loading = false

    @Prop(String) href!: string
    @Emit('update:href')
    updateHref(val: string) { }
    @Watch('href')
    hrefChanged(val: string) {
        const wv = this.$refs.webview as WebviewTag
        // prevent navigate twice
        if (!wv.getWebContents() || val !== wv.getURL()) {
            wv.src = val
        }
    }
    @Emit('update:status')
    updateStatus(status: WebView.Status) { }

    @Prop(Object) nav!: WebView.Nav
    @Watch('nav.goBack')
    goBack() { this.webview.goBack() }
    @Watch('nav.goForward')
    goForward() { this.webview.goForward() }
    @Watch('nav.reloadOrStop')
    reloadOrStop() {
        if (this.webview.isLoading()) {
            this.webview.stop()
        } else {
            this.webview.reload()
        }
    }

    _unbind!: () => void

    mounted() {
        this._unbind = this.bindEvents()
        // assign src manullay instead of v-bind:src to avoid some wired problems
        this.webview.src = this.href
    }
    destroyed() { this._unbind() }

    bindEvents() {
        let progress = 0
        let favicon = ''
        let title = ''
        const emitStatus = () => {
            if (!this.webview.getWebContents()) {
                return
            }
            const href = this.webview.getURL()
            if (href && href !== this.href) {
                this.updateHref(href)
            }
            this.updateStatus({
                title,
                favicon,
                progress: progress,
                canGoBack: this.webview.canGoBack(),
                canGoForward: this.webview.canGoForward()
            })
        }
        let timer: any
        const handleEvent = (ev: Event) => {
            console.log(ev.type, ev, Date.now())
            if (ev.type === 'new-window') {
                BUS.$emit('open-tab', { href: (ev as NewWindowEvent).url, mode: 'append-active' })
                return
            }


            switch (ev.type) {
                case 'did-start-loading':
                    this.loading = true
                    progress = 0.1
                    timer = setInterval(() => {
                        progress += (1 - progress) / (Math.random() * 10 + 20)
                        emitStatus()
                    }, 1000)
                    break
                case 'did-stop-loading':
                    this.loading = false
                    progress = 1
                    clearInterval(timer)
                    break
                case 'page-favicon-updated':
                    const favicons = (ev as PageFaviconUpdatedEvent).favicons
                    if (favicons[0]) {
                        favicon = favicons[0]
                    }
                    break
                case 'page-title-updated':
                    title = (ev as PageTitleUpdatedEvent).title || 'Untitled'
                    break
                case 'load-commit':
                case 'did-navigate':
                case 'update-target-url':
                case 'did-frame-finish-load':
                case 'did-finish-load':
                case 'did-change-theme-color':
                case 'did-get-response-details':
                case 'dom-ready':
                    progress += (1 - progress) / 10
                    break
            }
            if (ev.type === 'load-commit') {
                if ((ev as LoadCommitEvent).isMainFrame) {
                    this.domReady = false
                }
            } else if (ev.type === 'dom-ready') {
                this.domReady = true
            }
            this.webview.isConnected
            emitStatus()
        }

        events.forEach(e => this.webview.addEventListener(e, handleEvent))
        return () => {
            events.forEach(e => this.webview.removeEventListener(e, handleEvent))
        }
    }

    get webview() { return this.$refs.webview as WebviewTag }
}


const events = [
    'load-commit',
    'did-finish-load',
    'did-fail-load',
    'did-frame-finish-load',
    'did-start-loading',
    'did-stop-loading',
    'did-get-response-details',
    'did-get-redirect-request',
    'dom-ready',
    'page-title-updated',
    'page-favicon-updated',
    'enter-html-full-screen',
    'leave-html-full-screen',
    'console-message',
    'found-in-page',
    'new-window',
    'will-navigate',
    'did-navigate',
    'did-navigate-in-page',
    'close',
    'ipc-message',
    'crashed',
    'gpu-crashed',
    'plugin-crashed',
    'destroyed',
    'media-started-playing',
    'media-paused',
    'did-change-theme-color',
    'update-target-url',
    'devtools-opened',
    'devtools-closed',
    'devtools-focused',
]
</script>
