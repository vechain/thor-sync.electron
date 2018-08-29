<template>
  <div v-drag class="sync-viewport-container" :class="{'current': currentPort === instanceId, 'full-size': isFullSize}">
    <div class="port-title">
      <span>
      {{title}}
      </span>
    </div>
    <v-container fluid class='pa-0 ma-0 port-contral'>
      <v-layout row>
        <v-flex>
          <v-icon @click.stop="toggleFullSize">picture_in_picture_alt</v-icon>
        </v-flex>
        <v-flex>
          <v-icon @click.stop="closeWin">close</v-icon>
        </v-flex>
      </v-layout>
    </v-container>
    <v-container fluid class='pa-0 ma-0 sync-viewport-bar'>
      <v-layout row>
        <v-flex>
        </v-flex>
        <v-flex>
          <v-text-field v-model="origin" :placeholder="url" @keyup.enter="openTab" background-color="white" prepend-inner-icon="search"
            single-line class="mt-0" :hide-details="true"></v-text-field>
        </v-flex>
        <v-flex>
        </v-flex>
      </v-layout>
    </v-container>
    <webview ref="webview" autosize :preload="preload" :src="url"></webview>
  </div>
</template>

<script lang="ts">
const Dragable = require('draggabilly')
import { Component, Prop, Vue } from 'vue-property-decorator'
import { WebviewTag } from 'electron'

export interface portData {
  portId?: number
  contentId?: number
  url?: string
  [propName: string]: any
}

@Component({
  directives: {
    drag: {
      unbind(ele, binding, vnode) {
        let ctx = vnode.context as any
        let draggie = ctx.draggie
        draggie.destroy()
        window.removeEventListener('resize', ctx.onWindowResizeEnd)
      },
      inserted(ele: any, binding: any, vnode: any) {
        window.addEventListener('resize', vnode.context.onWindowResizeEnd)
        let opts = {
          containment: '.sync-container',
          handle: '.port-title'
        }
        vnode.context.draggie = new Dragable(ele, opts)
        vnode.context.draggie.setPosition(20, 20)
        vnode.context.draggie.on('staticClick', function() {
          vnode.context.$emit('switch-view', vnode.context.instanceId)
        })
        vnode.context.draggie.on('dragStart', function() {
          vnode.context.$emit('switch-view', vnode.context.instanceId)
        })
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

  preload: string = 'file:///' + (window as any).__preload
  origin: string = ''
  title: string = ''

  isFullSize: boolean = false

  draggie: any
  webview?: WebviewTag
  winResizeEnd: any

  back() {
    console.log('back')
  }
  toggleFullSize() {
    this.isFullSize = !this.isFullSize
  }
  closeWin() {
    this.$emit('close', this.instanceId)
  }
  openTab() {
    let data: portData = {
      url: this.origin
    }
    this.$emit('new-tab', data)
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
  faviconUpdate(event: Electron.PageFaviconUpdatedEvent) {
    let data: portData = {
      portId: this.instanceId,
      contentId: (this.webview as any).getWebContents().id,
      icons: event.favicons
    }

    this.$emit('favicon-updated', data)
  }

  titleUpdate(event: Electron.PageTitleUpdatedEvent) {
    let data: portData = {
      portId: this.instanceId,
      contentId: (this.webview as any).getWebContents().id,
      title: event.title
    }
    this.title = event.title
    this.$emit('title-updated', data)
  }
  newTab(evnet: Electron.NewWindowEvent) {
    let data: portData = {
      url: (event as any).url
    }
    this.$emit('new-tab', data)
  }
  mounted() {
    this.webview = this.$refs['webview'] as WebviewTag
    this.webview.addEventListener('page-title-updated', this.titleUpdate)
    this.webview.addEventListener('page-favicon-updated', this.faviconUpdate)
    this.webview.addEventListener('new-window', this.newTab)
  }
  destoryed() {
    ;(this.webview as any).removeEventListfener('new-window', this.newTab)
    ;(this.webview as any).removeEventListfener(
      'page-title-updated',
      this.titleUpdate
    )
    ;(this.webview as any).removeEventListfener(
      'page-favicon-updated',
      this.faviconUpdate
    )
  }
}
</script>

<style lang="scss" scoped>
.sync-viewport-container {
  overflow: hidden;
  box-shadow: 4px 4px 20px 0px rgba(0, 0, 0, 0.5);
  border-top-left-radius: 4px;
  border-top-right-radius: 4px;
  max-height: 100%;
  max-width: 100%;
  height: 550px;
  width: 800px;
  border: 1px solid #eee;
  transition: height 150ms linear, width 150ms linear;
}
.sync-viewport-container.full-size {
  top: 0 !important;
  left: 0 !important;
  width: 100% !important;
  height: 100% !important;
}
.sync-viewport-container::-webkit-resizer {
  background-image: -webkit-gradient(
    linear,
    right bottom,
    right top,
    color-stop(0, #d8d8d8),
    color-stop(0.83, #afafaf)
  );
}
.sync-viewport-container:after {
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
.sync-viewport-container.current:hover:after {
  cursor: nwse-resize;
  background-color: rgba(0, 0, 0, 0.3);
}
.sync-viewport-container .port-contral {
  width: 50px;
  height: 25px;
  position: absolute;
  top: 0;
  right: 0;
}
.sync-viewport-container .port-contral .v-icon {
  font-size: 19px;
  line-height: 20px;
}
.sync-viewport-container .port-title {
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
.sync-viewport-container .port-title:hover {
  cursor: move;
}
.sync-viewport-container webview {
  background-color: #fff;
  height: calc(100% - 35px);
}
.sync-viewport-container.is-pointer-down {
  z-index: 3;
  box-shadow: 4px 4px 20px 0px rgba(0, 0, 0, 0.34);
  opacity: 0.7;
}
.sync-viewport-container.current {
  resize: both;
  z-index: 2;
  box-shadow: 4px 4px 20px 0px rgba(0, 0, 0, 0.34);
}
.sync-viewport-bar {
  height: 35px;
  width: 100%;
  background-color: #cfd8dc;
}
</style>
