<template>
    <OverlayedMenu
        v-bind="$attrs"
        v-on="$listeners"
        right
        offset-y
        :close-on-content-click="false"
        max-height="500px"
        v-model="opened"
    >
        <slot slot="activator" name="activator"/>
        <v-card flat width="250">
            <v-card-text>
                <v-layout row align-center>
                    <div class="text-truncate subheading">{{config.name}}</div>
                    <v-spacer/>
                    <v-btn icon small class="ma-0" @click="onSettings">
                        <v-icon small>mdi-settings</v-icon>
                    </v-btn>
                </v-layout>
                <div class="caption text-truncate grey--text">{{config.url}}</div>
            </v-card-text>
            <v-card-text class="pt-0">
                <v-layout align-center>
                    <v-icon small class="mr-2">mdi-cube</v-icon>
                    {{headNumberText}}
                </v-layout>
                <v-layout align-center>
                    <v-icon small class="mr-2">mdi-swap-vertical-bold</v-icon>
                    {{progressText}}
                </v-layout>
            </v-card-text>
            <v-list two-line dense>
                <template v-for="(config, i) in otherConfigs">
                    <v-divider :key="`${i}-divider`"></v-divider>
                    <v-list-tile two-line :key="i" @click="switchNode(config)">
                        <v-list-tile-content>
                            <v-list-tile-title>
                                <NetworkName :genesis="config.genesis.id" class="mr-1"/>
                                {{config.name}}
                            </v-list-tile-title>
                            <v-list-tile-sub-title class="caption">{{config.url}}</v-list-tile-sub-title>
                        </v-list-tile-content>
                    </v-list-tile>
                </template>
            </v-list>
        </v-card>
    </OverlayedMenu>
</template>
<script lang="ts">
import { Vue, Component, Emit } from 'vue-property-decorator'
import { remote } from 'electron'
import { State } from 'vuex-class'
import { presets } from '@/node-configs'
import Store from '@/renderer/store'

type Status = Connex.Thor.Status

@Component
export default class NodeStatusPanel extends Vue {
    config = remote.getCurrentWebContents().getWebPreferences().nodeConfig!
    @Emit('switchNode')
    switchNode(config: NodeConfig) {
        this.opened = false
    }

    get configs() {
        const nodes = this.$store.state.nodes as entities.Node[]
        return [...presets, ...nodes]
    }

    get otherConfigs() {
        return this.configs.filter(c => c.url !== this.config.url || c.genesis.id !== this.config.genesis.id)
    }

    opened = false

    get progressText() {
        const syncStatus = (this.$store as Store).state.syncStatus
        if (syncStatus.flag === 'synced') {
            return 'Synced'
        } else {
            const progress = `${Math.floor(syncStatus.progress * 10000) / 100}%`
            if (syncStatus.flag === 'syncing') {
                return `Syncing [${progress}]`
            } else {
                return `Out of sync [${progress}]`
            }
        }
    }

    get headNumberText() {
        return (this.$store as Store).state.chainHead.number.toLocaleString()
    }

    onSettings() {
        BUS.$emit('open-tab', { href: 'sync://settings', mode: 'inplace-builtin' })
        this.opened = false
    }
}
</script>
