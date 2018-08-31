<template>
  <div class="sync-dapp-list">
    <slot/>
    <div v-for="(item, i) in list" :key="i">

    </div>
  </div>
</template>
<script lang="ts">
import { Vue, Prop } from 'vue-property-decorator'
export interface DApp {
  icon: string,
  url: string,
  name: string
}
export class AppList extends Vue {
  @Prop({default: []})
  private list!: DApp[]
}
</script>

