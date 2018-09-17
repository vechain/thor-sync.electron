<template>
  <div class="sync-tab-bar">
    <slot/>
    <div class="sync-tabs">
      <div @click.stop.prevent="switchTab(item.portId)" class="sync-tab" :class="{'current-tab': item.portId === currentTab}"
        v-for="item in tabs" :key="item.portId">
        <div class="tab-container" :title="item.title">
          <img :src="item.icon">
          <span>{{item.title}}</span>
          <v-icon @click.stop.prevent="popClose(item.portId, item.contentId)" class="tab-close">close</v-icon>
        </div>
      </div>
      <div class="add-tab">
        <v-btn @click.stop="addTab({title: 'New tab'})" icon>
          <v-icon>add</v-icon>
        </v-btn>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Emit } from 'vue-property-decorator'
import { portData } from '@/renderer/components/ViewPort.vue';
@Component
export default class Tabbar extends Vue {
    @Prop() private tabs!: any[]
    @Prop() private currentTab!: number

    @Emit('close')
    public popClose(portId: number) {}
    @Emit('switch')
    public switchTab(portId: number) {}
    @Emit('new-tab')
    public addTab(data: portData) {}
}
</script>

<style lang="scss" scoped>
.sync-tab-bar {
    padding-top: 10px;
    padding-right: 5px;
    height: 45px;
    width: 100%;
    -webkit-user-select: none;
    transition: padding-left 300ms ease-in-out;
    display: flex;
    justify-content: space-between;
}
.darwin .sync-tab-bar {
    padding-left: 55px;
}
.full-screen .sync-tab-bar {
    padding-left: 5px;
}
.sync-tab {
    padding-top: 8px;
    width: 150x;
    height: 32px;
    -webkit-user-select: none;
    -webkit-app-region: no-drag;
    border-top-left-radius: 7px;
    border-top-right-radius: 7px;
    width: 200px;
    background-color: #48bbc7;
    cursor: normal;
}
.sync-tab.current-tab {
    background-color: rgb(154, 236, 218);
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
    cursor: normal;
}
.tab-close {
    color: rgba(0, 0, 0, 0.29);
    font-size: 18px;
}
.sync-tabs {
    display: grid;
    grid-auto-columns: 1fr;
    grid-auto-flow: column;
}
.sync-tabs .add-tab {
  width: 45px;
    // background-color: #48bbc7;
}
.add-tab .v-btn {
    margin: 0;
    height: 30px;
    width: 30px;
}
</style>
