<template>
  <div v-drag="draggable" class="sync-viewport-container" :class="{'current': currentPort === instanceId, 'full-size': isFullSize, 'sync-viewport-win': draggable}">
    <div class="port-title" v-if="draggable">
      <span>
      {{title}}
      </span>
    </div>
    <v-container v-if="draggable" fluid class='pa-0 ma-0 port-contral'>
      <v-layout row>
        <v-flex>
          <v-icon @click.stop="toggleFullSize">picture_in_picture_alt</v-icon>
        </v-flex>
        <v-flex>
          <v-icon @click.stop="emitCloseWin(instanceId)">close</v-icon>
        </v-flex>
      </v-layout>
    </v-container>
    <v-container fluid class='pa-0 ma-0 sync-viewport-bar'>
      <v-layout row>
        <v-flex>
        </v-flex>
        <v-flex>
          <v-text-field v-model="origin" :placeholder="url" @keyup.enter="emitNewTab({ url: origin })" background-color="white"
            prepend-inner-icon="search" single-line class="mt-0" :hide-details="true"></v-text-field>
        </v-flex>
        <v-flex>
        </v-flex>
      </v-layout>
    </v-container>
    <webview :partition="partition" v-poster autosize :preload="preload" :src="url"></webview>
  </div>
</template>

<script lang="ts">
const Dragable = require('draggabilly')
import { Component, Prop, Vue, Emit } from 'vue-property-decorator'
import { WebviewTag } from 'electron'
import { VNodeDirective, VNode } from 'vue'

export interface portData {
  portId?: number
  contentId?: number
  url?: string
  [propName: string]: any
}

@Component({
  directives: {
    drag: {
      unbind(ele: Element, binding: VNodeDirective, vnode: VNode) {
        if (!binding.value) {
          return
        }
        let ctx = vnode.context as any
        let draggie = ctx.draggie
        draggie.destroy()
        window.removeEventListener('resize', ctx.onWindowResizeEnd)
      },
      bind(ele: Element, binding: VNodeDirective, vnode: VNode) {
        if (!binding.value) {
          return
        }

        let ctx = vnode.context as any

        window.addEventListener('resize', ctx.onWindowResizeEnd)
        let opts = {
          containment: '.sync-container',
          handle: '.port-title'
        }
        ctx.draggie = new Dragable(ele, opts)
        ctx.draggie.setPosition(20, 20)
        ctx.draggie.on('staticClick', function() {
          ctx.$emit('switch-view', ctx.instanceId)
        })
        ctx.draggie.on('dragStart', function() {
          ctx.$emit('switch-view', ctx.instanceId)
        })
      }
    },
    poster: {
      bind(ele: Element, binding: VNodeDirective, vnode: VNode) {
        let ctx = vnode.context as any
        ele.addEventListener('page-title-updated', ctx.titleUpdate)
        ele.addEventListener('page-favicon-updated', ctx.faviconUpdate)
        ele.addEventListener('new-window', ctx.newTab)
        ele.addEventListener('did-start-loading', ctx.updateLoadingStatus)
        ele.addEventListener('load-commit', ctx.updateLoadingStatus)
        ele.addEventListener('did-finish-load', ctx.updateLoadingStatus)
        ele.addEventListener('did-stop-loading', ctx.updateLoadingStatus)
        ele.addEventListener('did-fail-loading', ctx.updateLoadingStatus)
      },
      unbind(ele: Element, binding: VNodeDirective, vnode: VNode) {
        let ctx = vnode.context as any
        ele.removeEventListener('new-window', ctx.newTab)
        ele.removeEventListener('page-title-updated', ctx.titleUpdate)
        ele.removeEventListener('page-favicon-updated', ctx.faviconUpdate)
        ele.removeEventListener('did-start-loading', ctx.updateLoadingStatus)
        ele.removeEventListener('load-commit', ctx.updateLoadingStatus)
        ele.removeEventListener('did-finish-load', ctx.updateLoadingStatus)
        ele.removeEventListener('did-stop-loading', ctx.updateLoadingStatus)
        ele.removeEventListener('did-fail-loading', ctx.updateLoadingStatus) 
      }
    }
  }
})
export default class ViewPort extends Vue {
  @Prop({ default: 'https://explore.veforge.com/' })
  private url!: string
  @Prop({ default: Date.now() })
  private instanceId!: number
  @Prop() private currentPort!: number
  @Prop({ default: false })
  private draggable!: boolean

  @Emit('close')
  emitCloseWin(id: number) {}
  @Emit('new-tab')
  emitNewTab(data: portData) {}
  @Emit('favicon-updated')
  emitFavUpdate(data: portData) {}
  @Emit('title-updated')
  emitTitleUpdate(data: portData) {}
  @Emit('load-status-update')
  emitStatusUpdate(data: portData) {}

  preload = window.ENV.preload
  origin: string = ''
  title: string = ''

  isFullSize: boolean = false

  draggie: any
  winResizeEnd: any

  get partition() {
    let _url = new URL(this.url)
    return `${_url.host}`
  }

  toggleFullSize() {
    this.isFullSize = !this.isFullSize
  }

  onWindowResizeEnd(event: any) {
    window.clearTimeout(this.winResizeEnd)
    let _this = this
    this.winResizeEnd = window.setTimeout(function() {
      let position = _this.draggie.position
      let x: number = position.x
      let y: number = position.y
      if (position.x > 800) {
        x = position.x % 800
      }
      if (position.y > 600) {
        y = position.y % 600
      }
      _this.draggie.setPosition(x, y)
    }, 150)
  }

  updateLoadingStatus(event: Electron.Event) {
    console.log(event)
  }

  faviconUpdate(event: Electron.PageFaviconUpdatedEvent) {
    let wv = event.target as WebviewTag
    let data: portData = {
      portId: this.instanceId,
      contentId: wv.getWebContents().id,
      icons: event.favicons
    }

    this.emitFavUpdate(data)
  }

  titleUpdate(event: Electron.PageTitleUpdatedEvent) {
    let wv = event.target as WebviewTag
    let data: portData = {
      portId: this.instanceId,
      contentId: wv.getWebContents().id,
      title: event.title
    }
    this.title = event.title
    this.emitTitleUpdate(data)
  }

  newTab(evnet: Electron.NewWindowEvent) {
    let data: portData = {
      url: (event as any).url
    }
    this.emitNewTab(data)
  }
}
</script>

<style lang="scss" scoped>
.sync-viewport-container {
  overflow: hidden;
  height: 100%;
  width: 100%;
  transition: height 150ms linear, width 150ms linear, opacity 150ms linear;
}
.sync-viewport-container.sync-viewport-win {
  max-height: 100%;
  max-width: 100%;
  height: 550px;
  width: 800px;
  border: 1px solid #eee;
  border-top-left-radius: 4px;
  border-top-right-radius: 4px;
  box-shadow: 4px 4px 20px 0px rgba(0, 0, 0, 0.5);
}
.sync-viewport-win.is-pointer-down {
  z-index: 3;
  box-shadow: 4px 4px 20px 0px rgba(0, 0, 0, 0.3);
  opacity: 0.7;
}
.sync-viewport-container:not(.sync-viewport-win) {
  visibility: hidden;
}
.sync-viewport-container:not(.sync-viewport-win).current {
  visibility: visible;
}
.sync-viewport-win.current {
  resize: both;
  z-index: 2;
  box-shadow: 4px 4px 20px 0px rgba(0, 0, 0, 0.3);
}

.sync-viewport-container.sync-viewport-win.full-size {
  top: 0 !important;
  left: 0 !important;
  width: 100% !important;
  height: 100% !important;
  border: none;
  border-radius: 0;
  box-shadow: none;
  resize: none;
}
.sync-viewport-win::-webkit-resizer {
  background-image: -webkit-gradient(
    linear,
    right bottom,
    right top,
    color-stop(0, #d8d8d8),
    color-stop(0.83, #afafaf)
  );
}
.sync-viewport-win:after {
  content: ' ';
  display: block;
  width: 10px;
  height: 10px;
  background-color: transparent;
  position: absolute;
  bottom: 0;
  border-top-left-radius: 10px;
  right: 0;
}
.sync-viewport-win.current:not(.full-size):hover:after {
  cursor: nwse-resize;
  background-color: rgba(0, 0, 0, 0.3);
}
.sync-viewport-win .port-contral {
  width: 50px;
  height: 25px;
  position: absolute;
  top: 0;
  right: 0;
}
.sync-viewport-win .port-contral .v-icon {
  font-size: 19px;
  line-height: 20px;
}
.sync-viewport-win .port-title {
  height: 25px;
  left: 20px;
  text-align: center;
  font-size: 14px;
  line-height: 25px;
  color: #424242;
  border-bottom: 1px solid #eee;
  background-image: -webkit-gradient(
    linear,
    right bottom,
    right top,
    color-stop(0, #d8d8d8),
    color-stop(0.83, #afafaf)
  );
}
.sync-viewport-win .port-title:hover {
  cursor: move;
}
.sync-viewport-container webview {
  background-color: #fff;
  height: calc(100% - 35px);
}

.sync-viewport-bar {
  height: 35px;
  width: 100%;
  background-color: #cfd8dc;
}
</style>
