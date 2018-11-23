<template>
    <v-container>
        <v-layout row justify-center>
            <v-flex sm12 lg6>
                <v-card>
                    <v-card-title class="headline">Setting</v-card-title>
                    <v-card-text
                        class="grey--text text--darken-1"
                    >"Sync" releases updates from time to time. Install the update version for feature, security fixes, and improved software stability.</v-card-text>
                    <v-list>
                        <v-list-tile>
                            <v-list-tile-content>
                                <v-list-tile-title class="grey--text text--darken-3">Auto Update</v-list-tile-title>
                            </v-list-tile-content>
                            <!-- <v-list-tile-content> -->
                            <v-list-tile-action>
                                <v-switch @change="onChange" v-model="isAuto.value"></v-switch>
                            </v-list-tile-action>
                            <!-- </v-list-tile-content> -->
                        </v-list-tile>
                        <v-list-tile>
                            <v-list-tile-content>
                                <v-list-tile-title
                                    class="grey--text text--darken-3"
                                >Current Software Version</v-list-tile-title>
                            </v-list-tile-content>
                            <v-list-tile-action-text
                                class="grey--text text--darken-3"
                            >Current Software Version</v-list-tile-action-text>
                        </v-list-tile>
                    </v-list>
                </v-card>
            </v-flex>
        </v-layout>
    </v-container>
</template>
<script lang="ts">
import { Vue, Component, Watch } from 'vue-property-decorator'
import { State } from 'vuex-class'
import { Entities } from '../database'

@Component
export default class AutoUpdate extends Vue {
    name = 'auto_update'
    isAuto: any = {
        key: 'auto-update',
        value: false
    }
    @State
    preferencesRevision!: number

    async created() {
        await this.getConfig()
    }

    onChange() {
        DB.preferences.update(this.isAuto.id as any, {
            value: this.isAuto.value
        })
    }

    @Watch('preferencesRevision')
    async getConfig() {
        this.isAuto = await DB.preferences
            .where('key')
            .equals('auto-update')
            .first()
    }
}
</script>

