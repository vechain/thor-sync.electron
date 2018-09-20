<template>
    <div>
        Insight
        <div>
            <pre>{{block}}</pre>
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'
@Component
export default class App extends Vue {
    name: string = 'app'
    block = ''

    created() {
        ; (async () => {
            for (; ;) {
                try {
                    this.block = JSON.stringify(await connex.thor.block('best').get(), null, 4)
                    await connex.thor.nextTick()
                } catch{
                }

            }
        })()
    }
}
</script>
