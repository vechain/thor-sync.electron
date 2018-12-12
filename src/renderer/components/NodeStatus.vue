<template>
    <v-layout align-center class="caption" :style="styleObject">
        <v-icon small style="font-size:120%;color:inherit" class="mr-1">mdi-hexagon-slice-6</v-icon>
        <b>{{networkName}}</b>
    </v-layout>
</template>
<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'
import { State } from 'vuex-class'
import { remote } from 'electron'
import { nameOfNetwork } from '@/node-configs';
import Store from '@/renderer/store';
type Head = Connex.Thor.Status['head']

const nodeConfig = remote.getCurrentWebContents().getWebPreferences().nodeConfig!

@Component
export default class NodeStatus extends Vue {
    networkName = nameOfNetwork(nodeConfig.genesis.id)

    get styleObject() {
        const syncStatus = (this.$store as Store).state.syncStatus
        let color
        if (syncStatus.flag === 'synced') {
            color = 'rgba(0,192,0,0.9)'

        } else if (syncStatus.flag === 'syncing') {
            color = 'rgba(192,96,0,0.9)'
        } else {
            color = 'rgba(192,0,0,0.9)'
        }
        return { color }
    }
}
</script>
