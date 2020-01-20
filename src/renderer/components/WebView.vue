<template>
    <div style="position:relative" :style="{'background-color': error ? '': 'white'}">
        <webview
            v-if="!action.suspend"
            ref="webview"
            :partition="partition"
            :preload="preload"
            style="width:100%;height:100%;"
            :style="{'background-color': backgroundColor} "
            webpreferences="scrollBounce=yes, navigateOnDragDrop=yes, safeDialogs=yes"
            httpreferrer="https://vechain-sync"
        />
        <v-layout
            v-if="error"
            style="position:absolute;left:0;top:0;right:0;bottom:0;"
            align-center
            justify-center
        >
            <div style="width:500px;line-height:200%;">
                <v-icon large class="display-2" style="transition: none">mdi-hamburger</v-icon>
                <div class="display-1 font-weight-light">Failed to open</div>
                <b>{{currentHref}}</b>
                <div>{{error.name}} {{error.code}}</div>
                <q>{{error.desc}}</q>
            </div>
        </v-layout>
    </div>
</template>
<script lang="ts">
import { Vue, Component, Prop, Emit, Watch } from 'vue-property-decorator'
import { remote } from 'electron'
import * as NodeUrl from 'url'
import errorMap from '../net-error-list'
import * as AccessRecords from '../access-records'
import { buildContextMenu } from '@/common/context-menu'

@Component
export default class WebView extends Vue {
    readonly partition = `persist:${connex.thor.genesis.id}`
    readonly preload = ENV.preload

    @Prop(String) href!: string
    @Prop(Object) action!: WebAction

    emitHref(val: string) {
        if (!this.action.suspend) {
            this.$emit('update:href', val)
        }
    }

    emitStatus(status: WebStatus) {
        if (!this.action.suspend) {
            this.$emit('update:status', status)
        }
    }

    emitWheel(delta: { x: number; y: number }) {
        if (!this.action.suspend) {
            this.$emit('update:wheel', delta)
        }
    }

    currentHref = ''
    historyBackup = {
        stack: [] as string[],
        index: 0
    }

    status: WebStatus = {
        title: '',
        favicon: '',
        progress: 0,
        cert: null,
        committed: false,
        domReady: false,
        canGoForward: false,
        canGoBack: false
    }
    backgroundColor = ''
    error: { code: number; name: string; desc: string } | null = null

    get currentUrl() {
        return NodeUrl.parse(this.currentHref)
    }

    @Watch('href')
    hrefChanged(val: string) {
        // prevent navigate twice
        if (val !== this.currentHref) {
            this.webview.src = this.currentHref = val
        }
    }
    @Watch('status', { deep: true })
    statusChanged() {
        this.emitStatus({ ...this.status })
    }

    @Watch('action.goBack')
    goBack() {
        // should be guarded by committed status, or the history will incorrect when
        // fast back/forward
        if (this.webview.canGoBack() && this.status.committed) {
            this.webview.goBack()
            this.status.committed = false
        }
    }
    @Watch('action.goForward')
    goForward() {
        if (this.webview.canGoForward() && this.status.committed) {
            this.webview.goForward()
            this.status.committed = false
        }
    }
    @Watch('action.reload')
    reload() {
        this.webview.reload()
    }
    @Watch('action.reloadIgnoringCache')
    reloadIgnoreCache() {
        this.webview.reloadIgnoringCache()
    }
    @Watch('action.stop')
    stop() {
        this.status.progress = 1
        this.webview.stop()
    }
    @Watch('action.reGo')
    reGo() {
        this.webview.goToOffset(0)
    }
    @Watch('action.zoomIn')
    zoomIn() {
        if (this.status.domReady) {
            this.webContents.setZoomFactor(
                Math.min(3, this.webContents.getZoomFactor() + 0.2)
            )
        }
    }
    @Watch('action.zoomOut')
    zoomOut() {
        if (this.status.domReady) {
            this.webContents.setZoomFactor(
                Math.max(0.5, this.webContents.getZoomFactor() - 0.2)
            )
        }
    }
    @Watch('action.zoomReset')
    zoomReset() {
        if (this.status.domReady) {
            this.webContents.setZoomFactor(1)
        }
    }
    @Watch('action.suspend')
    suspend(val: WebAction['suspend']) {
        if (val) {
            const bak = this.historyBackup
            bak.stack = [...this.webContents.history]
            bak.index = Math.max(this.webContents.currentIndex, 0)
            if (val == 'strip') {
                bak.stack = bak.stack.slice(0, bak.index + 1)
            }
        } else {
            this.$nextTick(() => {
                if (!this.action.suspend) {
                    this.setup()
                }
            })
        }
    }

    webview!: Electron.WebviewTag
    webContents!: Electron.WebContents

    setup() {
        if (this.webview === this.$refs.webview) {
            LOG.warn('WebView: setup re-enter')
            return
        }
        this.webview = this.$refs.webview as Electron.WebviewTag
        this.webContents = this.webview.getWebContents()

        this.backgroundColor = ''
        this.status.domReady = false
        this.status.committed = false
        this.status.progress = 0

        const updateProgress = () => {
            this.status.progress += (1 - this.status.progress) / 10
        }
        this.webContents.on('context-menu', ({ sender }: any, props) => {
            const items = buildContextMenu(sender, props)
            if (items.length > 0) {
                remote.Menu.buildFromTemplate(items).popup({})
            }
        })

        this.webview.addEventListener('did-start-loading', ev => {
            LOG.debug('webview:', ev.type)
            this.status.domReady = false
            this.error = null
            this.status.progress = 0.05
            this.startFakeProgress()
        })
        this.webview.addEventListener('did-navigate', ev => {
            LOG.debug('webview:', ev.type, ev.url)
            this.backgroundColor = ''
            updateProgress()
        })
        this.webview.addEventListener('did-navigate-in-page', ev => {
            LOG.debug('webview:', ev.type, ev.isMainFrame, ev.url)
            this.status.domReady = true
        })
        this.webview.addEventListener('dom-ready', ev => {
            LOG.debug('webview:', ev.type)
            this.status.domReady = true
            if (this.elementVisible) {
                this.webview.blur()
                this.webview.focus()
            }
            updateProgress()
        })
        this.webview.addEventListener('did-stop-loading', ev => {
            LOG.debug('webview:', ev.type)
            this.status.progress = 1
            this.status.canGoForward = this.webview.canGoForward()
            this.status.canGoBack = this.webview.canGoBack()
            this.status.committed = true
            this.status.title = this.webview.getTitle()

            if (!this.error) {
                AccessRecords.record(
                    this.currentHref,
                    this.status.title,
                    this.status.favicon
                )
            }
        })
        this.webview.addEventListener('page-favicon-updated', ev => {
            LOG.debug('webview:', ev.type)
            this.status.favicon =
                ev.favicons.find(i => i.includes('32x32')) ||
                ev.favicons[0] ||
                ''
        })
        this.webview.addEventListener('page-title-updated', ev => {
            LOG.debug('webview:', ev.type, ev.title)
            this.status.title = ev.title
        })
        this.webview.addEventListener('load-commit', ev => {
            LOG.debug('webview:', ev.type, ev.isMainFrame, ev.url)
            if (ev.isMainFrame) {
                this.status.committed = true
                if (ev.url !== this.currentHref) {
                    if (
                        NodeUrl.parse(this.currentHref).host !==
                        NodeUrl.parse(ev.url).host
                    ) {
                        this.status.title = ''
                        this.status.favicon = ''
                        this.status.cert = null
                    }

                    this.currentHref = ev.url
                    this.emitHref(ev.url)
                }
                this.status.canGoForward = this.webview.canGoForward()
                this.status.canGoBack = this.webview.canGoBack()
                this.startQueryCert()
                updateProgress()
            }
        })
        this.webview.addEventListener('did-finish-load', ev => {
            LOG.debug('webview:', ev.type)
            this.status.progress = 1
            this.status.canGoForward = this.webview.canGoForward()
            this.status.canGoBack = this.webview.canGoBack()
            this.stopFakeProgress()
        })
        this.webview.addEventListener('did-fail-load', ev => {
            LOG.debug('webview:', ev.type, ev.errorCode, ev.validatedURL)
            if (ev.isMainFrame && ev.errorCode !== -3) {
                this.status.progress = 1
                this.status.title = ''
                this.status.favicon = ''
                this.status.cert = null
                this.status.canGoForward = this.webview.canGoForward()
                this.status.canGoBack = this.webview.canGoBack()
                this.backgroundColor = ''

                this.stopFakeProgress()
                this.currentHref = ev.validatedURL
                this.emitHref(this.currentHref)

                this.error = {
                    code: ev.errorCode,
                    ...(errorMap.get(ev.errorCode) || {
                        name: 'UNKNOWN_ERROR',
                        desc: ''
                    })
                }
            }
        })
        this.webview.addEventListener('enter-html-full-screen', ev => {
            LOG.debug('webview:', ev.type)
            if (this.elementVisible) {
                document.body.classList.remove('html-full-screen')
            }
        })
        this.webview.addEventListener('leave-html-full-screen', ev => {
            LOG.debug('webview:', ev.type)
            if (this.elementVisible) {
                document.body.classList.remove('html-full-screen')
            }
        })

        this.webview.addEventListener('new-window', ev => {
            LOG.debug('webview:', ev.type, ev.url)
            BUS.$emit('open-tab', { href: ev.url, mode: 'append-active' })
        })
        this.webview.addEventListener('ipc-message', ({ channel, args }) => {
            if (channel === 'wheel') {
                this.emitWheel(args[0])
            } else if (channel === 'bg-color') {
                this.backgroundColor = args[0]
            } else if (channel === 'keydown') {
                // workaround to https://github.com/electron/electron/issues/14258
                const kev = args[0]
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
                } as any)

                this.webview.dispatchEvent(emulatedKeyboardEvent)
            }
        })

        // assign src manullay instead of v-bind:src to avoid some wired problems
        const bak = this.historyBackup
        if (bak.stack.length > 0) {
            this.webContents.history = [...bak.stack]
            this.webContents.goToIndex(bak.index)
        } else {
            this.webview.src = this.currentHref = this.href
        }
    }

    mounted() {
        // to ensure WebViewTag.getWebContents is ready
        setTimeout(() => {
            this.setup()
        }, 0)
    }

    beforeDestroy() {
        this.stopFakeProgress()
        this.stopQueryCert()
    }

    _fakeProgressTimer: any
    stopFakeProgress() {
        if (this._fakeProgressTimer) {
            clearInterval(this._fakeProgressTimer)
            this._fakeProgressTimer = undefined
        }
    }
    startFakeProgress() {
        this.stopFakeProgress()
        this._fakeProgressTimer = setInterval(() => {
            this.status.progress += (1 - this.status.progress) / 30
            if (this.status.progress === 1) {
                this.stopFakeProgress()
            }
        }, 1500)
    }

    _queryCertTimer: any
    stopQueryCert() {
        if (this._queryCertTimer) {
            clearInterval(this._queryCertTimer)
            this._queryCertTimer = undefined
        }
    }
    startQueryCert() {
        this.stopQueryCert()
        const query = () => {
            const url = this.currentUrl
            if (
                url.hostname &&
                (url.protocol === 'https:' || url.protocol === 'wss:')
            ) {
                this.status.cert =
                    remote.app.EXTENSION.getCertificate(url.hostname) || null
                return !!this.status.cert
            }
            return true
        }
        if (!query()) {
            this._queryCertTimer = setInterval(() => {
                if (query()) {
                    this.stopQueryCert()
                }
            }, 1000)
        }
    }

    get elementVisible() {
        return this.$el.offsetWidth > 0 && this.$el.offsetHeight > 0
    }
}

declare module 'electron' {
    interface WebContents {
        history: string[]
        currentIndex: number
    }
}
</script>
