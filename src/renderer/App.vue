<template>
  <div id="app">
    <Tabbar @switch="switchTab" class="sync-drag-zone" :tabs="ports" :currentTab="currentPortId" @close="onremove"
    />
    <div class="sync-container">
      <viewport class="viewport-layout" v-for="item in ports" :key="item.portId" :currentPort="currentPortId"
        :instanceId="item.portId" :url="item.url" @title-updated="updateTitle" @favicon-updated="updateFavicon"
        @new-tab="newTab" @switch-view="switchTab" @close="onremove" />
      <DApps :list="apps" />
    </div>
  </div>
</template>
<script lang="ts">
import Tabbar from './components/tabBar.vue'
import { Component, Vue } from 'vue-property-decorator'
import ViewPort, { portData } from './components/ViewPort.vue'
import DApps from './components/AppList.vue'

@Component({
  components: {
    Tabbar,
    ViewPort,
    DApps
  }
})
export default class App extends Vue {
  private ports: portData[] = []
  private currentPortId?: number = this.ports.length ? this.ports[0]['portId']: 0
  private apps: object[] = [
    {
      name: 'APP1',
      url: 'https://baidu.com',
      icon: ''
    },
    {
      name: 'APP2',
      url: 'https://baidu.com',
      icon: ''
    },{
      name: 'APP3',
      url: 'https://baidu.com',
      icon: ''
    },
    {
      name: 'APP4',
      url: 'https://baidu.com',
      icon: ''
    },
    {
      name: 'APP4',
      url: 'https://baidu.com',
      icon: ''
    },
    {
      name: 'APP4',
      url: 'https://baidu.com',
      icon: ''
    },
    {
      name: 'APP4',
      url: 'https://baidu.com',
      icon: ''
    },
    {
      name: 'APP4',
      url: 'https://baidu.com',
      icon: ''
    }
  ]

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

  public onremove(portId: number) {
    let index = this.ports.findIndex(item => {
      return item.portId === portId
    })
    let tempCuttent: number
    let temp = this.ports.slice(index + 1)
    if (temp.length) {
      tempCuttent = temp[0]['portId'] as number
    } else {
      tempCuttent = this.ports[index ? index - 1 : 0]['portId'] as number
    }
    this.ports.splice(index, 1)
    this.currentPortId = tempCuttent
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
.sync-container {
  height: calc(100% - 41px);
  position: relative;
}
.sync-container .viewport-layout {
  position: absolute;
}
</style>
