<template>
  <div class="sync-dapp-list">
    <div>
      <slot/>
      <div class="dapp-container">
        <div class="dapp-item" @click.stop="openDapp({url: item.url})" v-for="item in list" :key="item.id">
          <div>
            <img :src="item.icon">
            <span>{{item.name}}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Prop, Component, Emit } from 'vue-property-decorator'
import { portData } from './ViewPort.vue'
export interface DApp {
  icon: string
  url: string
  name: string
}

@Component
export default class DApps extends Vue {
  @Prop() private list!: DApp[]

  @Emit('open-dapp')
  openDapp(data: portData) {}
}
</script>
<style lang="scss" scoped>
.sync-dapp-list div.dapp-container {
  display: grid;
  grid-template-columns: 160px 160px 160px 160px 160px 160px;
  grid-column-gap: 20px;
  grid-row-gap: 30px;
  justify-content: center;
}
.dapp-item {
  img {
    width: 100px;
    height: 100px;
    margin: auto;
    display: block;
    border: none;
    outline: none;
  }
}
@media screen and (max-width: 1200px) {
  .sync-dapp-list div.dapp-container {
    grid-template-columns: 160px 160px 160px 160px;
  }
}
</style>

