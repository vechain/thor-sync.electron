<template>
  <div class="sync-dapp-list">
    <slot/>
    <div class="dapp-item" @click.stop="openDapp" v-for="item in list" :key="item.id">
      <div>
        <img :src="item.icon">
        <span>{{item.name}}</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Prop, Component, Emit } from 'vue-property-decorator'
export interface DApp {
  icon: string
  url: string
  name: string
}

@Component
export default class DApps extends Vue {
  @Prop()
  private list!: DApp[]

  @Emit('open-dapp')
  openDapp() {}
}
</script>
<style lang="scss" scoped>
.sync-dapp-list {
  width: 75%;
  margin: auto;
  max-width: 1000px;
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
</style>

