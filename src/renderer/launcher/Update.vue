<template>
    <v-container>
        <v-layout row justify-center>
            <v-flex sm12 lg6>
                <h3 class="headline">VeChainSync</h3>
                <v-card>
                    <v-card-text class="grey--text text--darken-1">Version {{getVersion()}}</v-card-text>
                    <v-list>
                        <v-list-tile>
                            <v-list-tile-content>
                                <v-list-tile-title class="grey--text text--darken-3">Auto Update</v-list-tile-title>
                            </v-list-tile-content>
                            <v-list-tile-action>
                                <v-switch @change="onChange" v-model="isAuto.value"></v-switch>
                            </v-list-tile-action>
                        </v-list-tile>
                        <v-list-tile>
                            <v-list-tile-content>
                                <v-list-tile-title class="grey--text text--darken-3">Report an issue</v-list-tile-title>
                            </v-list-tile-content>
                            <v-list-tile-action>
                                <v-btn @click.stop="" icon ripple style="margin-right: 20px">
                                    <v-icon>launch</v-icon>
                                </v-btn>
                            </v-list-tile-action>
                        </v-list-tile>
                    </v-list>
                </v-card>
            </v-flex>
        </v-layout>
    </v-container>
</template>
<script lang="ts">
    import { Vue, Component, Watch, Emit } from 'vue-property-decorator'
    import { State } from 'vuex-class'
    import { Entities } from '../database'
    import { remote } from 'electron'

    @Component
    export default class AutoUpdate extends Vue {
        name = 'auto_update'
        isAuto: any = {
            key: 'auto-update',
            value: true
        }

        getVersion() {
            return remote.app.getVersion()
        }
        @State
        preferencesRevision!: number

        async created() {
            await this.getConfig()
        }

        @Emit('')
        reportIssue(link: string){}

        onChange() {
            if (this.isAuto.id) {
                GDB.preferences.update(this.isAuto.id as any, {
                    value: this.isAuto.value
                })
            } else {
                GDB.preferences.add(this.isAuto)
            }
        }

        @Watch('preferencesRevision')
        async getConfig() {
            let temp = await GDB.preferences
                .where('key')
                .equals('auto-update')
                .first()
            if (temp) {
                this.isAuto = temp
            }
        }
    }
</script>

