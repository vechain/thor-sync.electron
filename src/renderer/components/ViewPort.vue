<template>
    <div class="sync-viewport-container">
        <search-bar @operate="onOperate" @urlRequest="onUrlRequest" :opt="searchBarOpt" class="elevation-0" />
        <template v-if="url">
            <webview ref="viewport" :partition="partition" autosize :preload="preload" :src="url" />
        </template>
        <div v-if="!url" class="launcher-container">
            <Launcher @nav="onLauncherChange" ref="launcher"></Launcher>
        </div>
    </div>
</template>

<script lang="ts">
import SearchBar from './SearchBar.vue'
import { Component, Prop, Vue, Emit, Watch } from 'vue-property-decorator'
import Launcher from '../launcher'

@Component({
    components: {
        SearchBar,
        Launcher
    }
})
export default class ViewPort extends Vue {
    @Prop({
        default: {
            src: ''
        }
    })
    private opt!: ViewPort.Opt

    @Prop({ default: false })
    private draggable!: boolean

    private url: string = this.opt.src

    private searchBarOpt: SearchBar.Opt = {
        canGoBack: false,
        canGoForward: false,
        url: this.opt.src || ''
    }

    @Emit('data-updated')
    emitUpdateData(event: ViewPort.DataUpdateEvent) {}

    @Emit('status-updated')
    emitStatus(event: ViewPort.StatusUpdateEvent) {}

    preload = ENV.preload

    get partition() {
        return `persist:${connex.thor.genesis.id}`
    }

    @Watch('url')
    onUrlChange(newValue: any, oldValue: any) {
        if (oldValue === '') {
            this.$nextTick(() => {
                this.webviewEventBind()
            })
        }
    }

    searchBarOptUpdate() {
        const wv = this.$refs.viewport as Electron.WebviewTag
        this.searchBarOpt = {
            canGoBack: wv.canGoBack(),
            canGoForward: wv.canGoForward(),
            url: wv.getURL()
        }
    }

    searchBarOptUpdateLauncher() {
        const target = this.$refs.launcher as Launcher
        this.searchBarOpt = {
            canGoBack: target.canGoBack(),
            canGoForward: target.canGoForward(),
            url: ''
        }
    }

    onLauncherChange() {
        this.searchBarOptUpdateLauncher()
    }

    doSearchBarAction(action: string) {
        const target = this.url
            ? (this.$refs.viewport as Electron.WebviewTag)
            : (this.$refs.launcher as Launcher)

        switch (action) {
            case 'back':
                target.goBack()
                break
            case 'forward':
                target.goForward()
                break
            case 'refresh':
                target.reload()
                break
            default:
                break
        }
    }

    onOperate(action: string) {
        this.doSearchBarAction(action)
    }

    onUrlRequest(url: string) {
        this.searchBarOpt.url = url
        this.url = url
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
            // wv.addEventListener('did-navigate', this.pageOnNavigate)
            // wv.addEventListener(
            //     'did-navigate-in-page',
            //     this.pageOnNavigateInPage
            // )
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
            // wv.removeEventListener('did-navigate', this.pageOnNavigate)
            // wv.removeEventListener(
            //     'did-navigate-in-page',
            //     this.pageOnNavigateInPage
            // )
            wv.removeEventListener('load-commit', this.updateLoadingStatus)
            wv.removeEventListener('did-finish-load', this.updateLoadingStatus)
            wv.removeEventListener('did-stop-loading', this.updateLoadingStatus)
            wv.removeEventListener('did-fail-loading', this.updateLoadingStatus)
        }
    }

    updateLoadingStatus(event: any) {
        this.emitStatus({ status: event.type })
    }

    // pageOnNavigate(event: Electron.DidNavigateEvent) {
    //     this.emitUpdateData({ type: 'url', value: event.url })
    // }
    // pageOnNavigateInPage(event: Electron.DidNavigateInPageEvent) {
    //     this.emitUpdateData({ type: 'url', value: event.url })
    // }

    faviconUpdate(event: Electron.PageFaviconUpdatedEvent) {
        this.emitUpdateData({ type: 'icon', value: event.favicons[0] })
    }

    titleUpdate(event: Electron.PageTitleUpdatedEvent) {
        this.emitUpdateData({ type: 'title', value: event.title })
        this.searchBarOptUpdate()
        // this.emitUpdateData({
        //     type: 'contentId',
        //     value: (this.$refs['viewport'] as WebviewTag).getWebContents().id
        // })
    }

    onNewWindow(event: Electron.NewWindowEvent) {
        // this.emitUpdateData({ type: 'new-window', value: event.url })
    }
}
</script>

<style lang="scss" scoped>
.sync-viewport-container {
    overflow: hidden;
    width: 100%;
    background-color: #fff;
}
.sync-viewport-container .launcher-container,
.sync-viewport-container webview {
    background-color: #fff;
    height: calc(100% - 40px);
    overflow: auto;
}
.sync-viewport-container.full-height webview {
    height: 100%;
}
</style>
