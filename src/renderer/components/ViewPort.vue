<template>
  <div class="sync-viewport-container" :class="{'current': currentPort === instanceId}">
    <v-container fluid class='pa-0 ma-0 sync-viewport-bar'>
      <v-layout row>
        <v-flex>
        </v-flex>
        <v-flex>
            <v-text-field v-model="origin" :placeholder="url" @keyup.enter="newTab" background-color="white" prepend-inner-icon="search" single-line class="mt-0" :hide-details="true"></v-text-field>
        </v-flex>
        <v-flex>
        </v-flex>
      </v-layout>
    </v-container>
    <webview ref="webview" :preload="preload" :src="url"></webview>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { WebviewTag } from 'electron'

export interface portData {
  portId?: number
  contentId?: number
  url?: string
  [propName: string]: any
}

@Component
export default class ViewPort extends Vue {
  preload: string = 'file:///' + (window as any).__preload
  origin: string = ''
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
  mounted() {
    let webview: any = this.$refs['webview']
    webview.addEventListener('page-title-updated', (event: any) => {
      let data: portData = {
        portId: this.instanceId,
        contentId: webview.getWebContents().id,
        title: event.title
      }
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
  visibility: hidden;
}
.sync-viewport-container.current {
  visibility: visible;
}
.sync-viewport-container {
  height: 100%;
  width: 100%;
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
