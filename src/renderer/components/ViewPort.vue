<template>
  <div>
    <webview :preload="preload" :src="url"></webview>
  </div>
</template>
<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component
export default class ViewPort extends Vue {
  public preload: string = 'file:///' + (window as any).__preload
  @Prop({default: 'http://localhost:127.0.0.1:8669'}) private url!: string
}
</script>

