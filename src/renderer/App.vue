<template>
  <div id="app">
    <Tabbar @switch="switchTab" class="sync-drag-zone" :tabs="ports" :currentTab="currentPortId" @close="removeTab"
    />
    <div class="sync-container">
      <viewport class="viewport-layout" v-for="item in ports" :key="item.id" :currentPort="currentPortId" :instanceId="item.portId" :url="item.url"
        @title-updated="updateTitle" @favicon-updated="updateFavicon" @new-tab="newTab" />
    </div>
  </div>
</template>
<script lang="ts">
import Tabbar from './components/tabBar.vue'
import { Component, Vue } from 'vue-property-decorator'
import viewport, { portData } from './components/ViewPort.vue'
@Component({
  components: {
    Tabbar,
    viewport
  }
})
export default class App extends Vue {
  private ports: portData[] = [{ portId: Date.now() }]
  private currentPortId?: number = this.ports[0]['portId']

  public addPort(data: portData) {
    let now = Date.now()
    this.currentPortId = now
    this.ports.push({ portId: data.portId || now, url: data.url })
  }
  public updateTitle(data: portData) {
    let index = this.ports.findIndex(item => {
      return item.portId === data.portId
    })

    this.$set(this.ports[index], 'contentId', data.contentId)
    this.$set(this.ports[index], 'title', data.title)
  }
  public switchTab(portId: number) {
    this.currentPortId = portId
  }
  public newTab(data: portData) {
    this.addPort({
      url: data.url
    })
  }

  public removeTab(portId: number) {
    let index = this.ports.findIndex(item => {
      return item.portId === portId
    })

    if (index >= 0) {
      this.ports.splice(index, 1)
    }
    if (this.ports.length === 0) {
      this.ports.push({
        portId: Date.now(),
        title: 'New tab'
      })
    } else {
      this.currentPortId = this.ports[index - 1]['portId']
    }
  }

  public updateFavicon(data: portData) {
    let index = this.ports.findIndex(item => {
      return item.portId === data.portId
    })
    this.$set(this.ports[index], 'contentId', data.contentId)
    this.$set(this.ports[index], 'icon', data.icons[0])
  }
}
</script>

<style lang="scss">
body {
  background: #fff;
  height: 100vh;
  width: 100vw;
}
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  text-align: center;
  color: #2c3e50;
  height: 100%;
  width: 100%;
}
.sync-drag-zone {
  -webkit-app-region: drag;
}
.sync-tab {
  width: 200px;
  background-color: #00796b;
}
.sync-container {
  height: calc(100% - 41px);
  position: relative;
}
.sync-container .viewport-layout {
  position: absolute;
}
</style>
