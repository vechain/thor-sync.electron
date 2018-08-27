<template>
  <div v-drag class="sync-viewport-container" :class="{'current': currentPort === instanceId}">
    <div class="port-title">
      <span>
      {{title}}
      </span>
    </div>
    <v-container fluid class='pa-0 ma-0 port-contral'>
      <v-layout row>
        <v-flex>
          <v-icon>aspect_ratio</v-icon>
        </v-flex>
        <v-flex>
          <v-icon>launch</v-icon>
        </v-flex>
        <v-flex>
          <v-icon>close</v-icon>
        </v-flex>
      </v-layout>
    </v-container>
    <v-container fluid class='pa-0 ma-0 sync-viewport-bar'>
      <v-layout row>
        <v-flex>
        </v-flex>
        <v-flex>
          <v-text-field v-model="origin" :placeholder="url" @keyup.enter="newTab" background-color="white" prepend-inner-icon="search"
            single-line class="mt-0" :hide-details="true"></v-text-field>
        </v-flex>
        <v-flex>
        </v-flex>
      </v-layout>
    </v-container>
    <webview @click.stop.prevent="nonClick" ref="webview" :preload="preload" :src="url"></webview>
  </div>
</template>

<script lang="ts">
const Dragable = require('draggabilly')
import { Component, Prop, Vue } from 'vue-property-decorator'
import { WebviewTag } from 'electron'
import { readdir } from 'fs'

export interface portData {
  portId?: number
  contentId?: number
  url?: string
  [propName: string]: any
}

@Component({
  directives: {
    drag: {
      inserted: (ele: any, binding: any, vnode: any) => {
        let opts = {
          containment: '.sync-container',
          handle: '.port-title'
        }
        let draggie = new Dragable(ele, opts)
        draggie.on('staticClick', function() {
          vnode.context.$emit('switch-view', vnode.context.instanceId)
        })
        draggie.on('dragStart', function() {
          vnode.context.$emit('switch-view', vnode.context.instanceId)
        })
      }
    }
  }
})
export default class ViewPort extends Vue {
  preload: string = 'file:///' + (window as any).__preload
  origin: string = ''
  title: string = ''
  @Prop({ default: 'https://explore.veforge.com/' })
  private url!: string

  @Prop({ default: Date.now() })
  private instanceId!: number

  @Prop() private currentPort!: number

  public back() {}
  newTab() {
    let data: portData = {
      url: this.origin
    }
    this.$emit('new-tab', data)
  }
  nonClick() {
    return false
  }
  mounted() {
    let webview: any = this.$refs['webview']
    webview.addEventListener('page-title-updated', (event: any) => {
      let data: portData = {
        portId: this.instanceId,
        contentId: webview.getWebContents().id,
        title: event.title
      }
      this.title = event.title
      this.$emit('title-updated', data)
    })
    webview.addEventListener('page-favicon-updated', (event: any) => {
      let data: portData = {
        portId: this.instanceId,
        contentId: webview.getWebContents().id,
        icons: event.favicons
      }
      this.$emit('favicon-updated', data)
    })
    webview.addEventListener('new-window', (event: any) => {
      let data: portData = {
        url: event.url
      }
      this.$emit('new-tab', data)
    })
  }
}
</script>

<style lang="scss" scoped>
.sync-viewport-container {
  overflow: hidden;
  box-shadow: 4px 4px 20px 0px rgba(0, 0, 0, 0.5);
  border-top-left-radius: 4px;
  border-top-right-radius: 4px;
}
.sync-viewport-container .port-contral {
  width: 100px;
  height: 25px;
  position: absolute;
  top: 0;
  right: 0;
}
.sync-viewport-container .port-contral .v-icon {
  font-size: 17px;
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
}
.sync-viewport-container.is-pointer-down {
  z-index: 3;
  box-shadow: 4px 4px 20px 0px rgba(0, 0, 0, 0.34);
}
.sync-viewport-container.current {
  z-index: 2;
  box-shadow: 4px 4px 20px 0px rgba(0, 0, 0, 0.34);
}
.sync-viewport-container {
  max-height: 100%;
  max-width: 100%;
  height: 600px;
  width: 800px;
  border: 1px solid #eee;
}
.sync-viewport-container webview {
  height: calc(100% - 35px);
}
.sync-viewport-bar {
  height: 35px;
  width: 100%;
  background-color: #cfd8dc;
}
</style>
