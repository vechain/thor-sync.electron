<template>
    <OverlayedMenu dark left offset-y :close-on-content-click="false" max-height="500px" max-width="200px" min-width="180px" v-model="opened">
        <v-btn flat light small slot="activator" :color="chainStatus.progress === 1 ? 'green' : 'red'">
            {{siteConfig.name}}
        </v-btn>
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
                <template v-for="site in otherSiteConfigs">
                    <v-divider :key="`${site.genesis.id}@${site.url}-divider`"></v-divider>
                    <v-list-tile two-line :key="`${site.genesis.id}@${site.url}`" @click="activateOrOpenWindow(site)">
                        <v-list-tile-content>
                            <v-list-tile-title>
                                {{site.name}}
                            </v-list-tile-title>
                            <v-list-tile-sub-title class="caption">
                                {{site.url}}
                            </v-list-tile-sub-title>
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
import OverlayedMenu from './OverlayedMenu.vue'

type Status = Connex.Thor.Status

const backend = remote.app.backend
const siteConfig = backend.getSiteConfig(remote.getCurrentWebContents().id)!
const otherSiteConfigs = backend
    .siteConfigs
    .filter(
        c => c !== siteConfig)

@Component({
    components: {
        OverlayedMenu
    }
})
export default class NetworkStatus extends Vue {
    siteConfig = siteConfig
    otherSiteConfigs = otherSiteConfigs

    @State chainStatus!: Status
    opened = false

    get progressText() {
        return (Math.round(this.chainStatus.progress * 10000) / 100).toString() + '%'
    }

    get headNumberText() {
        return '#' + this.chainStatus.head.number.toLocaleString()
    }

    activateOrOpenWindow(config: (typeof remote.app.backend.siteConfigs)[number]) {
        this.opened = false
        const wins = remote.BrowserWindow.getAllWindows()
        for (const w of wins) {
            const c = remote.app.backend.getSiteConfig(w.webContents.id)
            if (c && c.url === config.url && c.genesis.id === config.genesis.id) {
                w.show()
                return
            }
        }
        remote.app.createWindow(config)
    }
}
</script>
