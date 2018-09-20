<template>
    <div class="sync-viewport-container" :class="{'full-height': !addressBar}">
        <v-container v-if="addressBar" fluid class='pa-0 ma-0 sync-viewport-bar'>
            <v-layout row>
                <v-flex>
                </v-flex>
                <v-flex>
                    <v-text-field class="custom-field mt-0" height="34px" v-model="origin" :placeholder="url" background-color="white"
                        prepend-inner-icon="search" single-line :hide-details="true"></v-text-field>
                </v-flex>
                <v-flex>
                </v-flex>
            </v-layout>
        </v-container>
        <webview v-if="url" ref="viewport" :partition="partition" autosize :preload="preload" :src="url"></webview>
        <slot name="content" />
    </div>
</template>

<script lang="ts">
const Dragable = require('draggabilly')
import { Component, Prop, Vue, Emit, Watch } from 'vue-property-decorator'

@Component
export default class ViewPort extends Vue {
    @Prop({ default: 'https://explore.veforge.com/' })
    private url!: string

    @Prop({ default: false })
    private draggable!: boolean

    @Prop({ default: true })
    private addressBar!: boolean

    @Prop({default: ''})
    private account!: string

    @Emit('data-updated')
    emitUpdateData(event: ViewPort.DataUpdateEvent) {}

    @Emit('status-update')
    emitStatus(event: ViewPort.StatusUpdateEvent) {}

    preload = window.ENV.preload
    origin: string = ''
    title: string = ''

    get partition() {
        return `persist:${thor.genesis.id}/${this.account}`
    }

    @Watch('url')
    onUrlChange(newValue: any, oldValue: any) {
        if (!oldValue) {
            this.webviewEventBind()
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

            wv.removeEventListener('load-commit', this.updateLoadingStatus)
            wv.removeEventListener('did-finish-load', this.updateLoadingStatus)
            wv.removeEventListener('did-stop-loading', this.updateLoadingStatus)
            wv.removeEventListener('did-fail-loading', this.updateLoadingStatus)
        }
    }

    updateLoadingStatus(event: any) {
        this.emitStatus({ status: event.type })
    }

    faviconUpdate(event: Electron.PageFaviconUpdatedEvent) {
        this.emitUpdateData({ type: 'icon', value: event.favicons[0] })
    }

    titleUpdate(event: Electron.PageTitleUpdatedEvent) {
        this.title = event.title
        this.emitUpdateData({ type: 'title', value: event.title })
    }

    onNewWindow(event: Electron.NewWindowEvent) {
        this.emitUpdateData({ type: 'new-window', value: event.url })
    }
}
</script>

<style lang="scss" scoped>
.sync-viewport-container {
    overflow: hidden;
    height: 100%;
    width: 100%;
    background-color: #fff;
    // transition: height 150ms linear, width 150ms linear, opacity 150ms linear;
}
// .sync-viewport-container.sync-viewport-win {
//     max-height: 100%;
//     max-width: 100%;
//     height: 550px;
//     width: 800px;
//     border: 1px solid #eee;
//     border-top-left-radius: 4px;
//     border-top-right-radius: 4px;
//     box-shadow: 4px 4px 20px 0px rgba(0, 0, 0, 0.5);
// }
// .sync-viewport-win.is-pointer-down {
//     z-index: 3;
//     box-shadow: 4px 4px 20px 0px rgba(0, 0, 0, 0.3);
//     opacity: 0.7;
// }
// .sync-viewport-container:not(.sync-viewport-win) {
//     visibility: hidden;
//     position: absolute;
//     top: 0;
// }
// .sync-viewport-container:not(.sync-viewport-win).current {
//     visibility: visible;
// }
// .sync-viewport-win.current {
//     resize: both;
//     z-index: 2;
//     box-shadow: 4px 4px 20px 0px rgba(0, 0, 0, 0.3);
// }

// .sync-viewport-container.sync-viewport-win.full-size {
//     top: 0 !important;
//     left: 0 !important;
//     width: 100% !important;
//     height: 100% !important;
//     border: none;
//     border-radius: 0;
//     box-shadow: none;
//     resize: none;
// }
// .sync-viewport-win::-webkit-resizer {
//     background-image: -webkit-gradient(
//         linear,
//         right bottom,
//         right top,
//         color-stop(0, #d8d8d8),
//         color-stop(0.83, #afafaf)
//     );
// }
// .sync-viewport-win:after {
//     content: ' ';
//     display: block;
//     width: 10px;
//     height: 10px;
//     background-color: transparent;
//     position: absolute;
//     bottom: 0;
//     border-top-left-radius: 10px;
//     right: 0;
// }
// .sync-viewport-win.current:not(.full-size):hover:after {
//     cursor: nwse-resize;
//     background-color: rgba(0, 0, 0, 0.3);
// }
// .sync-viewport-win .port-contral {
//     width: 50px;
//     height: 25px;
//     position: absolute;
//     top: 0;
//     right: 0;
// }
// .sync-viewport-win .port-contral .v-icon {
//     font-size: 19px;
//     line-height: 20px;
// }
// .sync-viewport-win .port-title {
//     height: 25px;
//     left: 20px;
//     text-align: center;
//     font-size: 14px;
//     line-height: 25px;
//     color: #424242;
//     border-bottom: 1px solid #eee;
//     background-image: -webkit-gradient(
//         linear,
//         right bottom,
//         right top,
//         color-stop(0, #d8d8d8),
//         color-stop(0.83, #afafaf)
//     );
// }
// .sync-viewport-win .port-title:hover {
//     cursor: move;
// }
.sync-viewport-container webview {
    background-color: #fff;
    height: calc(100% - 35px);
}
.sync-viewport-container.full-height webview {
    height: 100%;
}
.sync-viewport-bar {
    height: 35px;
    width: 100%;
    background-color: #cfd8dc;
}
.sync-viewport-bar .custom-field {
    padding-top: 0;
}
</style>
