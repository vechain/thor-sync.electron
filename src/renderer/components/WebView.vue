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
import { Vue, Component, Prop, Emit, Watch } from 'vue-property-decorator'
import {
    WebviewTag,
    PageFaviconUpdatedEvent,
    NewWindowEvent,
    MenuItemConstructorOptions,
    PageTitleUpdatedEvent,
    LoadCommitEvent,
    remote,
    DidFailLoadEvent,
    IpcMessageEvent,
    WebContents,
    clipboard
} from 'electron'
import * as NodeUrl from 'url'
import errorMap from '../net-error-list'
import * as AccessRecords from '../access-records'
const { download } = require('electron-dl')

@Component
export default class WebView extends Vue {
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

    domReady = false

    @Prop(Number) zoomfactor!: number
    @Emit('update:zoomfactor')
    updateZoomFactor(val: number) { }
    @Watch('zoomfactor')
    zoomFactorChanged() {
        if (this.domReady) {
            this.webview.getWebContents().setZoomFactor(this.zoomfactor)
        }
    }

    get currentUrl() { return NodeUrl.parse(this.currentHref) }

    @Prop(Boolean) visible!: boolean
    @Watch('visible')
    visibleChanged() {
        if (this.visible) {
            this.webview.focus()
            if (this.domReady) {
                this.webview.getWebContents().getZoomFactor(f => {
                    this.updateZoomFactor(f)
                })
            }
        } else {
            this.webview.blur()
        }
    }

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
    @Watch('nav.reload')
    reload() { this.webview.reload() }
    @Watch('nav.reloadIgnoringCache')
    reloadIgnoreCache() { this.webview.reloadIgnoringCache() }
    @Watch('nav.stop')
    stop() {
        this.progress = 1
        this.webview.stop()
    }
    @Watch('nav.reGo')
    reGo() {
        this.webview.goToOffset(0)
    }

    _unbind !: () => void
    mounted() {
        installContextMenu(this.webview.getWebContents())
        this._unbind = this.bindEvents()
        // assign src manullay instead of v-bind:src to avoid some wired problems
        this.webview.src = this.currentHref = this.href
    }
    destroyed() { this._unbind() }

    bindEvents() {
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

        let normalNavigate = false

        const handleEvent = (ev: Event) => {
            if (ev.type === 'new-window') {
                BUS.$emit('open-tab', { href: (ev as NewWindowEvent).url, mode: 'append-active' })
                return
            } else if (ev.type === 'ipc-message') {
                const ipcMsgEv = ev as IpcMessageEvent
                if (ipcMsgEv.channel === 'wheel') {
                    this.updateWheel(ipcMsgEv.args[0])
                } else if (ipcMsgEv.channel === 'bg-color') {
                    this.backgroundColor = ipcMsgEv.args[0]
                } else if (ipcMsgEv.channel === 'keydown') {
                    // workaround to https://github.com/electron/electron/issues/14258
                    const kev = ipcMsgEv.args[0]
                    const emulatedKeyboardEvent = new KeyboardEvent('keydown', {
                        bubbles: true,
                        cancelable: true,
                        code: kev.code,
                        key: kev.key,
                        keyCode: kev.keyCode,
                        shiftKey: kev.shiftKey,
                        altKey: kev.altKey,
                        ctrlKey: kev.ctrlKey,
                        metaKey: kev.metaKey,
                        repeat: kev.repeat
                    } as KeyboardEvent)

                    this.webview.dispatchEvent(emulatedKeyboardEvent)
                }
                return
            } else if (ev.type === 'did-start-loading') {
                this.domReady = false
                normalNavigate = false
                this.backgroundColor = ''
                this.progress = 0.1
                this.errorCode = 0
                this.errorName = ''
                this.errorDesc = ''
                fakeProgress()
            } else if (ev.type === 'did-stop-loading') {
                if (!normalNavigate) {
                    this.domReady = true
                }
                this.title = this.webview.getTitle()
                if (normalNavigate && this.errorCode === 0) {
                    AccessRecords.record(
                        this.webview.src!,
                        this.title,
                        this.favicon)
                }
                this.progress = 1
            } else if (ev.type === 'did-navigate') {
                normalNavigate = true
            } else if (ev.type === 'page-favicon-updated') {
                const favicons = (ev as PageFaviconUpdatedEvent).favicons
                this.favicon = favicons.find(i => i.includes('32x32')) || favicons[0] || ''
            } else if (ev.type === 'page-title-updated') {
                this.title = (ev as PageTitleUpdatedEvent).title || 'Untitled'
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
            } else if (ev.type === 'dom-ready') {
                this.domReady = true
                this.webview.getWebContents().getZoomFactor(f => {
                    this.updateZoomFactor(f)
                })

                // here to fix focus problem(e.g. input can't be foused) when navigation finished
                if (this.visible) {
                    this.webview.blur()
                    this.webview.focus()
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

function installContextMenu(wc: WebContents) {
    wc.on('context-menu', ({ sender }, props) => {
        const hasText = !!props.selectionText
        const menuTpl: MenuItemConstructorOptions[] = [{
            id: 'cut',
            label: 'Cut',
            enabled: props.editFlags.canCut,
            visible: props.isEditable,
            click: () => sender.cut()
        }, {
            id: 'copy',
            label: 'Copy',
            enabled: props.editFlags.canCopy,
            visible: props.isEditable || hasText,
            click: () => sender.copy()
        }, {
            id: 'paste',
            label: 'Paste',
            enabled: props.editFlags.canPaste,
            visible: props.isEditable,
            click: () => sender.paste()
        }, {
            id: 'save',
            label: 'Save Image',
            click: (item, win) => {
                download(win, props.srcURL, { saveAs: true })
            },
            visible: props.mediaType === 'image'
        }, {
            id: 'copyLink',
            label: 'Copy Link',
            click: () => {
                clipboard.write({
                    bookmark: props.linkText,
                    text: props.linkURL,
                })
            },
            visible: !!props.linkURL && props.mediaType === 'none'
        }, {
            id: 'copyImageLink',
            label: 'Copy Image Link',
            click: () => {
                clipboard.write({
                    bookmark: props.srcURL,
                    text: props.srcURL
                })
            },
            visible: props.mediaType === 'image'
        }, {
            id: 'inspect',
            label: 'Inspect Element',
            click: () => {
                sender.inspectElement(props.x, props.y)
                if (sender.isDevToolsOpened()) {
                    sender.devToolsWebContents.focus()
                }
            }
        }]

        remote.Menu
            .buildFromTemplate(menuTpl)
            .popup({})
    })
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
    'dom-ready'
])
</script>
