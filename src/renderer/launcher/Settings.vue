<template>
    <div>
        <v-tabs centered v-model="active" dark>
            <v-tab :to="{name: item.path}" v-for="(item, index) in tabs" :key="index">
                {{item.name}}
            </v-tab>
        </v-tabs>
        <router-view />
    </div>
</template>
<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'

@Component
export default class Settings extends Vue {
    name: string = 'settings'
    active = 0
    tabs = [
        {
            name: 'Shortcut',
            path: 'settings-shortcut'
        },
        {
            name: 'Network',
            path: 'settings-network'
        },
        {
            name: 'Update',
            path: 'settings-update'
        }
    ]
}
</script>

