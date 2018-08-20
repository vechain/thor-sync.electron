<template>
  <div>
    <webview :preload="preload" :src="url"></webview>
  </div>
</template>
<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component
export default class ViewPort extends Vue {
  preload: string = 'file:///' + (window as any).__preload
  @Prop() private url?: string
}
</script>

