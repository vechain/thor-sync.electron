<template>
    <Tooltip>
        <v-layout align-center class="caption" :style="styleObject" slot="activator">
            <v-icon small style="font-size:120%;color:inherit" class="mr-1">mdi-hexagon-slice-6</v-icon>
            <b>{{networkName}}</b>
        </v-layout>
        <span>{{networkDesc}}</span>
    </Tooltip>
</template>
<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'
import { State } from 'vuex-class'
import { remote } from 'electron'
import { nameOfNetwork } from '@/node-configs';
import Store from '@/renderer/store';
type Head = Connex.Thor.Status['head']

@Component
export default class NodeStatus extends Vue {
    networkName = nameOfNetwork(NODE_CONFIG.genesis.id)

    get syncStatus() {
        return (this.$store as Store).state.syncStatus.flag
    }

    get styleObject() {
        let color
        if (this.syncStatus === 'synced') {
            color = 'rgba(0,192,0,0.9)'
        } else if (this.syncStatus === 'syncing') {
            color = 'rgba(192,96,0,0.9)'
        } else {
            color = 'rgba(192,0,0,0.9)'
        }
        return { color }
    }

    get networkDesc() {
        switch (this.networkName) {
            case 'test': return `VeChain TestNet - ${this.syncStatus}`
            case 'main': return `VeChain MainNet - ${this.syncStatus}`
            case 'solo': return `VeChain Solo - ${this.syncStatus}`
            default: return `Unknown Network - ${this.syncStatus}`
        }
    }
}
</script>
