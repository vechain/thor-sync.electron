<template>
    <div
        v-bind="$attrs"
        v-on="$listeners"
        style="position:relative"
        :style="{visibility: visible?'visible': 'hidden'}"
    >
        <webview
            ref="webview"
            :partition="partition"
            :preload="preload"
            style="width:100%;height:100%;"
            :style="{'background-color': backgroundColor} "
            webpreferences="scrollBounce=yes, navigateOnDragDrop=yes, safeDialogs=yes"
        />
        <v-layout
            v-if="!!errorCode"
            style="position:absolute;left:0;top:0;right:0;bottom:0;"
            class="grey lighten-4"
            align-center
            justify-center
        >
            <div style="width:500px;line-height:200%;">
                <v-icon large class="display-2" style="transition: none">mdi-hamburger</v-icon>
                <div class="display-1 font-weight-light">Failed to open</div>
                <b>{{currentHref}}</b>
                <div>{{errorName}} {{errorCode}}</div>
                <q>{{errorDesc}}</q>
            </div>
        </v-layout>
    </div>
</template>
<script lang="ts">
import { Vue, Component, Prop, Emit, Watch, Mixins } from 'vue-property-decorator'
import { WebviewTag, PageFaviconUpdatedEvent, NewWindowEvent, PageTitleUpdatedEvent, LoadCommitEvent, remote, DidFailLoadEvent, IpcMessageEvent } from 'electron'
import * as NodeUrl from 'url'
import AccessHistory from '../mixins/access-history'
import errorMap from '../net-error-list'

@Component
export default class WebView extends Mixins(AccessHistory) {
    readonly partition = `persist:${connex.thor.genesis.id}`
    readonly preload = ENV.preload
    currentHref = ''
    progress = 0
    title = ''
    favicon = ''
    cert: Electron.CertificateVerifyProcRequest | null = null
    backgroundColor = ''
    errorCode = 0
    errorName = ''
    errorDesc = ''

    get currentUrl() { return NodeUrl.parse(this.currentHref) }

    @Prop(Boolean) visible!: boolean

    @Prop(String) href!: string
    @Emit('update:href')
    updateHref(val: string) { }
    @Watch('href')
    hrefChanged(val: string) {
        // prevent navigate twice
        if (val !== this.currentHref) {
            this.title = ''
            this.favicon = ''
            this.cert = null
            this.webview.src = this.currentHref = val
        }
    }
    @Emit('update:status')
    updateStatus(status: WebView.Status) { }
    @Emit('update:wheel')
    updateWheel(delta: { x: number, y: number }) { }

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
            this.webview.reload()
        }
    }
    @Watch('nav.reGo')
    reGo() {
        this.webview.goToOffset(0)
    }

    _unbind !: () => void
    mounted() {
        this._unbind = this.bindEvents()
        // assign src manullay instead of v-bind:src to avoid some wired problems
        this.webview.src = this.currentHref = this.href
    }
    destroyed() { this._unbind() }

    bindEvents() {
        let domReady = false
        const emitStatus = () => {
            this.updateStatus({
                title: this.title,
                favicon: this.favicon,
                progress: this.progress,
                canGoBack: this.webview.canGoBack(),
                canGoForward: this.webview.canGoForward(),
                cert: this.cert
            })
        }
        const fakeProgress = () => {
            if (!this.webview.isConnected || !this.webview.isLoading()) {
                return
            }
            this.progress += (1 - this.progress) / 30
            setTimeout(fakeProgress, 2000)
        }

        const handleEvent = (ev: Event) => {
            if (ev.type === 'new-window') {
                BUS.$emit('open-tab', { href: (ev as NewWindowEvent).url, mode: 'append-active' })
                return
            } else if (ev.type === 'ipc-message') {
                const ipcMsgEv = ev as IpcMessageEvent
                if (ipcMsgEv.channel === 'webview-wheel') {
                    this.updateWheel(ipcMsgEv.args[0])
                }
                return
            } if (ev.type === 'did-start-loading') {
                domReady = false
                this.backgroundColor = ''
                this.progress = 0.1
                this.errorCode = 0
                this.errorName = ''
                this.errorDesc = ''
                fakeProgress()
            } else if (ev.type === 'did-stop-loading') {
                this.title = this.webview.getTitle()
                if (domReady) {
                    this.updateHistory(this.webview.src!, {
                        title: this.title,
                        favicon: this.favicon
                    })
                }
                this.progress = 1
            } else if (ev.type === 'page-favicon-updated') {
                const favicons = (ev as PageFaviconUpdatedEvent).favicons
                if (favicons[0]) {
                    this.favicon = favicons[0]
                }
            } else if (ev.type === 'page-title-updated') {
                this.title = (ev as PageTitleUpdatedEvent).title || 'Untitled'
            } else if (ev.type === 'dom-ready') {
                domReady = true
                this.webview
                    .getWebContents()
                    .executeJavaScript('window.getComputedStyle(document.body).getPropertyValue("background-color")')
                    .then((color: string) => this.backgroundColor = color)
                    .catch(console.warn)
            } else if (ev.type === 'load-commit') {
                const loadCommit = ev as LoadCommitEvent
                if (loadCommit.isMainFrame) {
                    if (loadCommit.url !== this.currentHref) {
                        if (NodeUrl.parse(this.currentHref).host !== NodeUrl.parse(loadCommit.url).host) {
                            this.title = ''
                            this.favicon = ''
                            this.cert = null
                        }

                        this.currentHref = loadCommit.url
                        this.updateHref(loadCommit.url)
                    }
                }
            } else if (ev.type === 'enter-html-full-screen') {
                if (this.visible) {
                    document.body.classList.add('html-full-screen')
                }
            } else if (ev.type === 'leave-html-full-screen') {
                if (this.visible) {
                    document.body.classList.remove('html-full-screen')
                }
            } else if (ev.type === 'did-fail-load') {
                const didFailLoad = ev as DidFailLoadEvent
                if (didFailLoad.isMainFrame && didFailLoad.errorCode !== -3) {
                    this.title = ''
                    this.favicon = ''
                    this.cert = null

                    this.currentHref = didFailLoad.validatedURL
                    this.updateHref(this.currentHref)
                    this.errorCode = didFailLoad.errorCode
                    const obj = errorMap.get(didFailLoad.errorCode) || { name: '', desc: '' }
                    this.errorName = obj.name
                    this.errorDesc = obj.desc
                }
            }

            if (progressEvents.has(ev.type)) {
                this.progress += (1 - this.progress) / 10
            }

            const url = this.currentUrl
            if (url.hostname && (url.protocol === 'https:' || url.protocol === 'wss:')) {
                this.cert = remote.app.EXTENSION.getCertificate(url.hostname) || null
            }

            emitStatus()
        }

        allEvents.forEach(e => this.webview.addEventListener(e, handleEvent))
        return () => {
            allEvents.forEach(e => this.webview.removeEventListener(e, handleEvent))
        }
    }

    get webview() { return this.$refs.webview as WebviewTag }
}

const allEvents = [
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

const progressEvents = new Set([
    'load-commit',
    'did-finish-load',
    'did-fail-load',
    'did-frame-finish-load',
    'dom-ready',
    'page-title-updated',
    'page-favicon-updated',
    'did-change-theme-color',
])
</script>
