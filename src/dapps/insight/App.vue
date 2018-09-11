<template>
  <div>
    Insight
    {{block}}
  </div>
</template>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'
@Component
export default class App extends Vue{
  name: string = 'app'
  block = window.connex.thor.bestBlock
  created() {
    (async () => {
    for ( ;;) {
      await  window.connex.thor.nextTick()
      this.block = window.connex.thor.bestBlock
    }
    })()
  }  
}
</script>

