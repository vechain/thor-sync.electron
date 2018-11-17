<template>
    <OverlayedMenu
        right
        offset-y
        :close-on-content-click="false"
        max-height="500px"
        max-width="200px"
        min-width="180px"
        v-model="opened"
    >
        <slot slot="activator" name="activator"/>
        <v-card flat>
            <v-container>
                <v-layout column>
                    <v-flex>
                        <v-icon small>mdi-clock</v-icon>
                        <span>{{progressText}}</span>
                    </v-flex>
                    <v-flex>
                        <v-icon small>mdi-animation</v-icon>
                        <span>{{headNumberText}}</span>
                    </v-flex>
                </v-layout>
            </v-container>
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

type Status = Connex.Thor.Status

@Component
export default class NetworkStatusPanel extends Vue {
    otherConfigs = siteConfigs
        .filter(
            c => {
                const config = remote.getCurrentWebContents().getWebPreferences().siteConfig!
                return c.url !== config.url || c.genesis.id !== config.genesis.id
            })

    @State chainStatus!: Status
    opened = false

    get progressText() {
        return (Math.round(this.chainStatus.progress * 10000) / 100).toString() + '%'
    }

    get headNumberText() {
        return '#' + this.chainStatus.head.number.toLocaleString()
    }

    activateOrOpenWindow(config: Connex.Thor.Site.Config) {
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
}
</script>
