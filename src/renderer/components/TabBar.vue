<template>
  <div class="sync-tab-bar">
    <div @click.stop.prevent="switchTab(item.portId)" class="sync-tab" :class="{'current-tab': item.portId === currentTab}" v-for="item in tabs" :key="item.portId">
      <div class="tab-container" :title="item.title">
        <img :src="item.icon">
        <span>{{item.title}}</span>
        <v-icon @click.stop.prevent="popClose(item.portId, item.contentId)" class="tab-close">close</v-icon>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
@Component
export default class Tabbar extends Vue {
  @Prop() private tabs!: any[]
  @Prop() private currentTab!: number
  public popClose(portId: number) {
    this.$emit('close', portId)
  }

  public switchTab(portId: number) {
    this.$emit('switch', portId)
  }
}
</script>

<style lang="scss" scoped>
.sync-tab-bar {
  padding-top: 10px;
  padding-right: 5px;
  height: 41px;
  width: 100%;
  -webkit-user-select: none;
  background-color: #cfd8dc;
  transition: padding-left 300ms ease-in-out;
  border-bottom: 1px solid #eee;
  display: flex;
  flex-direction: row;
}
.darwin .sync-tab-bar {
  padding-left: 80px;
}
.full-screen .sync-tab-bar {
  padding-left: 5px;
}
.sync-tab {
  padding-top: 5px;
  width: 150x;
  height: 30px;
  -webkit-user-select: none;
  -webkit-app-region: no-drag;
  background-color: rgb(220, 226, 228);
  border-top-left-radius: 7px;
  border-top-right-radius: 7px;
  // border-color: transparent;
  border: 1px solid #eee;
  cursor: normal;
}
.sync-tab.current-tab {
  background-color: #fff;
}
.sync-tab img {
  width: 15px;
  height: 15px;
  margin-top: 2px;
}
.sync-tab span {
  font-size: 13px;
  max-width: 140px;
  height: 20px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.sync-tab .tab-container {
  display: flex;
  flex-direction: row;
  justify-content: space-around;
}
.tab-close {
  color: rgba(0, 0, 0, 0.29);
  font-size: 18px;
}
</style>
