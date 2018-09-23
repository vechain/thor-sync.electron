<template>
    <v-menu dark :close-on-content-click="false" offset-y>
        <v-chip slot="activator" :color="chainStatus.progress === 1 ? 'green' : 'red'" disabled text-color="white" small>
            {{siteName}}
        </v-chip>
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
            <v-divider></v-divider>
            <v-list>
                <v-list-tile v-for="site in siteConfigs" two-line :key="site.genesis.id +'@' + site.url">
                    <v-list-tile-content>
                        <v-list-tile-title>
                            {{site.name}}
                        </v-list-tile-title>
                        <v-list-tile-sub-title class="caption">
                            {{site.url}}
                        </v-list-tile-sub-title>
                    </v-list-tile-content>
                    <v-list-tile-action>
                        <v-btn icon ripple>
                            <v-icon small>launch</v-icon>
                        </v-btn>
                    </v-list-tile-action>
                </v-list-tile>
            </v-list>
        </v-card>
    </v-menu>

</template>
<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'
import { remote } from 'electron'
import { State } from 'vuex-class'

type Status = Connex.Thor.Status

@Component
export default class NetworkStatus extends Vue {
    siteName = remote
        .app
        .backend
        .getSiteConfig(remote.getCurrentWebContents().id)!.name

    siteConfigs = remote.app.backend.siteConfigs

    @State chainStatus!: Status

    get progressText() {
        return (Math.round(this.chainStatus.progress * 10000) / 100).toString() + '%'
    }

    get headNumberText() {
        return '#' + this.chainStatus.head.number.toLocaleString()
    }
}
</script>
