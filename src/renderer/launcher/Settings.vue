<template>
    <v-layout column align-center>
        <v-layout column style="max-width: 800px; width: 100%" class="pa-3">
            <div>
                <Update></Update>
            </div>
            <div>
                <Networks></Networks>
            </div>
        </v-layout>
    </v-layout>
</template>
<script lang="ts">
    import { Vue, Component } from 'vue-property-decorator'
    import Networks from './Networks.vue'
    import Update from './Update.vue'

    @Component({
        components: {
            Networks,
            Update
        }
    })
    export default class Settings extends Vue {
        name: string = 'settings'
        active = 0
        tabs = ['Shortcuts', 'Networks', 'Update']
    }
</script>

