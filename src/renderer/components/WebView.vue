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
import * as NodeUrl from 'url'
@Component
export default class WebView extends Vue {
    readonly partition = `persist:${connex.thor.genesis.id}`
    readonly preload = ENV.preload

    currentHref = ''
    domReady = false
    progress = 0

    get loading() {
        return this.progress !== 1
    }

    @Prop(String) href!: string
    @Emit('update:href')
    updateHref(val: string) { }
    @Watch('href')
    hrefChanged(val: string) {
        // prevent navigate twice
        if (val !== this.currentHref) {
            this.webview.src = this.currentHref = val
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
            this.progress = 1
            this.webview.stop()
        } else {
            this.webview.src = this.webview.src
        }
    }

    _unbind !: () => void
    mounted() {
        this._unbind = this.bindEvents()
        // assign src manullay instead of v-bind:src to avoid some wired problems
        this.webview.src = this.currentHref = this.href
    }
    destroyed() { this._unbind() }

    bindEvents() {
        let favicon = ''
        let title = ''
        let lastHref = this.currentHref

        const emitStatus = () => {
            if (!this.webview.getWebContents()) {
                return
            }

            this.updateStatus({
                title,
                favicon,
                progress: this.progress,
                canGoBack: this.webview.canGoBack(),
                canGoForward: this.webview.canGoForward()
            })
        }
        let timer: any
        const handleEvent = (ev: Event) => {
            if (ev.type === 'new-window') {
                BUS.$emit('open-tab', { href: (ev as NewWindowEvent).url, mode: 'append-active' })
                return
            }

            switch (ev.type) {
                case 'did-start-loading':
                    this.progress = 0.1
                    timer = setInterval(() => {
                        this.progress += (1 - this.progress) / (Math.random() * 10 + 20)
                        emitStatus()
                    }, 1000)
                    break
                case 'did-stop-loading':
                    this.progress = 1
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
                case 'did-frame-finish-load':
                case 'did-finish-load':
                case 'did-change-theme-color':
                case 'dom-ready':
                    this.progress += (1 - this.progress) / 10
                    break
            }
            if (ev.type === 'load-commit') {
                const loadCommit = ev as LoadCommitEvent
                if (loadCommit.isMainFrame) {
                    this.domReady = false
                    this.currentHref = loadCommit.url

                    if (loadCommit.url !== lastHref) {
                        if (NodeUrl.parse(lastHref).host !== NodeUrl.parse(loadCommit.url).host) {
                            title = ''
                            favicon = ''
                        }

                        lastHref = loadCommit.url
                        this.updateHref(loadCommit.url)
                    }
                }
            } else if (ev.type === 'dom-ready') {
                this.domReady = true
            }
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
    //    'did-get-response-details',
    'did-get-redirect-request',
    'dom-ready',
    'page-title-updated',
    'page-favicon-updated',
    'enter-html-full-screen',
    'leave-html-full-screen',
    //    'console-message',
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
    //    'update-target-url',
    'devtools-opened',
    'devtools-closed',
    'devtools-focused',
]
</script>
