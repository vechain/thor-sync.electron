<template>
    <div>
        <v-tabs centered v-model="active">
            <v-tab v-for="(item, index) in tabs" :key="index">{{item}}</v-tab>
            <v-tab-item>
                <Shortcuts/>
            </v-tab-item>
            <v-tab-item>
                <Networks/>
            </v-tab-item>
            <v-tab-item>
                <Update/>
            </v-tab-item>
        </v-tabs>
    </div>
</template>
<script lang="ts">
    import { Vue, Component } from 'vue-property-decorator'
    import Shortcuts from './Shortcuts.vue'
    import Networks from './Networks.vue'
    import Update from './Update.vue'

    @Component({
        components: {
            Shortcuts,
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

