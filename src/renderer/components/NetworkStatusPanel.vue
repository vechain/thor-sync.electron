<template>
    <OverlayedMenu
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
                    <div class="text-truncate title" style="flex:1 1 auto">{{config.name}}</div>
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
            <v-list>
                <template v-for="site in otherConfigs">
                    <v-divider :key="`${site.genesis.id}@${site.url}-divider`"></v-divider>
                    <v-list-tile
                        two-line
                        :key="`${site.genesis.id}@${site.url}`"
                        @click="activateOrOpenWindow(site)"
                    >
                        <v-list-tile-content>
                            <v-list-tile-title>{{site.name}}</v-list-tile-title>
                            <v-list-tile-sub-title class="caption">{{site.url}}</v-list-tile-sub-title>
                        </v-list-tile-content>
                    </v-list-tile>
                </template>
            </v-list>
        </v-card>
    </OverlayedMenu>
</template>
<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'
import { remote } from 'electron'
import { State } from 'vuex-class'
import siteConfigs from '../../site-configs'
import { Entities } from '@/renderer/database';

type Status = Connex.Thor.Status

@Component
export default class NetworkStatusPanel extends Vue {
    config = remote.getCurrentWebContents().getWebPreferences().siteConfig!

    get configs() {
        const networks = this.$store.state.networks as Entities.Preference<'network'>[]
        return [...siteConfigs, ...networks.map(n => n.value)]
    }

    get otherConfigs() {
        return this.configs.filter(c => c.url !== this.config.url || c.genesis.id !== this.config.genesis.id)
    }

    @State chainStatus!: Status
    opened = false

    get progressText() {
        if (this.chainStatus.progress === 1) {
            return 'Synced'
        }

        return `Syncing (${Math.floor(this.chainStatus.progress * 10000) / 100}%)`
    }

    get headNumberText() {
        return this.chainStatus.head.number.toLocaleString()
    }

    activateOrOpenWindow(config: Thor.Site.Config) {
        this.opened = false
        const wins = remote.BrowserWindow.getAllWindows()
        const found = wins.find(w => {
            try {
                const c = w.webContents.getWebPreferences().siteConfig!
                return c.url === config.url && c.genesis.id === config.genesis.id
            } catch{
                return false
            }
        })
        if (found) {
            found.show()
        } else {
            remote.app.EXTENSION.createWindow(config)
        }
    }
    onSettings() {
        BUS.$emit('open-tab', { href: 'sync://settings', mode: 'inplace-builtin' })
        this.opened = false
    }
}
</script>
