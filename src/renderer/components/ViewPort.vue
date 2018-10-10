<template>
    <div class="sync-viewport-container" :class="{'full-height': !addressBar}">
        <webview v-if="url && norefresh" ref="viewport" :partition="partition" autosize :preload="preload" webpreferences="xargs.clientId=todo"
            :src="url" />
        <slot name="content" />
    </div>
</template>

<script lang="ts">
const Dragable = require('draggabilly')
import { Component, Prop, Vue, Emit, Watch } from 'vue-property-decorator'
import { WebviewTag } from 'electron'

@Component
export default class ViewPort extends Vue {
    @Prop({ default: '' })
    private url!: string

    @Prop({ default: false })
    private draggable!: boolean

    @Prop({ default: true })
    private addressBar!: boolean

    @Prop({ default: '' })
    private account!: string

    private norefresh: boolean = true

    @Emit('data-updated')
    emitUpdateData(event: ViewPort.DataUpdateEvent) {}

    @Emit('status-update')
    emitStatus(event: ViewPort.StatusUpdateEvent) {}

    preload = ENV.preload

    get partition() {
        return `persist:${connex.thor.genesis.id}`
    }

    @Watch('url')
    onUrlChange(newValue: any, oldValue: any) {
        if (!oldValue || oldValue === '') {
            this.$nextTick(() => {
                this.webviewEventBind()
            })
        }
    }

    mounted() {
        this.webviewEventBind()
    }
    destoryed() {
        this.webviewEventUnbind()
    }
    webviewEventBind() {
        if (this.$refs.viewport) {
            let wv = this.$refs.viewport as Electron.WebviewTag
            wv.addEventListener('page-title-updated', this.titleUpdate)
            wv.addEventListener('page-favicon-updated', this.faviconUpdate)
            wv.addEventListener('new-window', this.onNewWindow)
            wv.addEventListener('did-navigate', this.pageOnNavigate)
            wv.addEventListener(
                'did-navigate-in-page',
                this.pageOnNavigateInPage
            )
            wv.addEventListener('did-start-loading', this.updateLoadingStatus)

            wv.addEventListener('load-commit', this.updateLoadingStatus)
            wv.addEventListener('did-finish-load', this.updateLoadingStatus)
            wv.addEventListener('did-stop-loading', this.updateLoadingStatus)
            wv.addEventListener('did-fail-loading', this.updateLoadingStatus)
        }
    }

    webviewEventUnbind() {
        if (this.$refs.viewport) {
            let wv = this.$refs.viewport as Electron.WebviewTag
            wv.removeEventListener('page-title-updated', this.titleUpdate)
            wv.removeEventListener('page-favicon-updated', this.faviconUpdate)
            wv.removeEventListener('new-window', this.onNewWindow)
            wv.removeEventListener(
                'did-start-loading',
                this.updateLoadingStatus
            )
            wv.removeEventListener('did-navigate', this.pageOnNavigate)
            wv.removeEventListener(
                'did-navigate-in-page',
                this.pageOnNavigateInPage
            )
            wv.removeEventListener('load-commit', this.updateLoadingStatus)
            wv.removeEventListener('did-finish-load', this.updateLoadingStatus)
            wv.removeEventListener('did-stop-loading', this.updateLoadingStatus)
            wv.removeEventListener('did-fail-loading', this.updateLoadingStatus)
        }
    }

    updateLoadingStatus(event: any) {
        this.emitStatus({ status: event.type })
    }

    pageOnNavigate(event: Electron.DidNavigateEvent) {
        this.emitUpdateData({ type: 'url', value: event.url })
    }
    pageOnNavigateInPage(event: Electron.DidNavigateInPageEvent) {
        this.emitUpdateData({ type: 'url', value: event.url })
    }

    faviconUpdate(event: Electron.PageFaviconUpdatedEvent) {
        this.emitUpdateData({ type: 'icon', value: event.favicons[0] })
    }

    titleUpdate(event: Electron.PageTitleUpdatedEvent) {
        this.emitUpdateData({ type: 'title', value: event.title })
        this.emitUpdateData({
            type: 'contentId',
            value: (this.$refs['viewport'] as WebviewTag).getWebContents().id
        })
    }

    onNewWindow(event: Electron.NewWindowEvent) {
        this.emitUpdateData({ type: 'new-window', value: event.url })
    }
}
</script>

<style lang="scss" scoped>
.sync-viewport-container {
    overflow: hidden;
    width: 100%;
    background-color: #fff;
}
.sync-viewport-container webview {
    background-color: #fff;
    height: 100%;
}
.sync-viewport-container.full-height webview {
    height: 100%;
}
</style>
