<template>
    <div>
        Insight
        <div><pre>{{block}}</pre></div>
    </div>
</template>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'
@Component
export default class App extends Vue {
    name: string = 'app'
    block = JSON.stringify(connex.thor.bestBlock, null, 4)

    created() {
        ;(async () => {
            for (;;) {
                await connex.thor.nextTick()
                this.block = JSON.stringify(connex.thor.bestBlock, null, 4)
            }
        })()
    }
}
</script>

