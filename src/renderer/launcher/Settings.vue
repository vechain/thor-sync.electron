<template>
    <v-layout column align-center>
        <v-layout column style="max-width: 800px; width: 100%" class="pa-3">
            <div>
                <Update></Update>
            </div>
            <div>
                <Nodes></Nodes>
            </div>
        </v-layout>
    </v-layout>
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

