<template>
    <v-layout column>
        <v-subheader>General</v-subheader>
        <v-card>
            <v-card-text>
                <span>About VeChain Sync</span>
                <br>
                <span class="grey--text text--darken-1">Sync {{getVersion()}} / Connex {{connexV}}</span>
            </v-card-text>
            <v-divider/>
            <v-list>
                <v-list-tile>
                    <v-list-tile-content>
                        <v-list-tile-title class="grey--text text--darken-3">Check Update</v-list-tile-title>
                    </v-list-tile-content>
                    <v-list-tile-action>
                        <v-btn color="primary" class="font-weight-regular" @click.stop="checkUpdate" flat ripple>Check</v-btn>
                    </v-list-tile-action>
                </v-list-tile>
                <v-divider/>
                <v-list-tile>
                    <v-list-tile-content>
                        <v-list-tile-title class="grey--text text--darken-3">Report an issue</v-list-tile-title>
                    </v-list-tile-content>
                    <v-list-tile-action>
                        <v-btn color="primary" class="font-weight-regular" @click.stop="reportIssue" flat ripple>Open</v-btn>
                    </v-list-tile-action>
                </v-list-tile>
            </v-list>
        </v-card>
    </v-layout>
</template>
<script lang="ts">
    import { Vue, Component, Watch, Emit } from 'vue-property-decorator'
    import { State } from 'vuex-class'
    import { Entities } from '../database'
    import { remote } from 'electron'

    @Component
    export default class AutoUpdate extends Vue {
        name = 'auto_update'
        connexV = connex.version

        getVersion() {
            return remote.app.getVersion()
        }
        @State
        preferencesRevision!: number

        reportIssue() {
            BUS.$emit('open-tab', {
                href: 'https://github.com/vechain/thor-sync.electron/issues/new'
            })
        }
    }
</script>

