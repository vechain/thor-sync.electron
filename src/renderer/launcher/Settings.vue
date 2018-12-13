<template>
    <div class="pa-3">
        <div style="max-width: 800px; width: 100%; margin: 0 auto;">
            <div>
                <Update></Update>
            </div>
            <div>
                <Nodes></Nodes>
            </div>
        </div>
    </div>
</template>
<script lang="ts">
    import { Vue, Component } from 'vue-property-decorator'
    import Nodes from './Nodes.vue'
    import Update from './Update.vue'

    @Component({
        components: {
            Nodes,
            Update
        }
    })
    export default class Settings extends Vue {
        name: string = 'settings'
        active = 0
        tabs = ['Shortcuts', 'Networks', 'Update']
    }
</script>

