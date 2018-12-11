<template>
    <v-layout column>
        <v-subheader>
            <span class="subheading">Networks</span>
            <v-spacer/>
            <a @click="dialog = true" style="float: right; margin-right: 20px; margin-top: 5px;">Add</a>
        </v-subheader>
        <v-card>
            <v-card-title v-if="!rows.length">
                <h3 class="subheading">No network items!</h3>
            </v-card-title>
            <v-list v-if="rows.length" two-line subheader>
                <div v-for="(item, index) in rows" :key="index">
                    <v-list-tile avatar>
                        <v-list-tile-content>
                            <v-list-tile-title>{{item.value.name}}</v-list-tile-title>
                            <v-list-tile-sub-title>{{item.value.url}}</v-list-tile-sub-title>
                        </v-list-tile-content>
                        <v-list-tile-action>
                            <v-btn icon @click="onEdit(item)" ripple dark color="#82B1FF">
                                <v-icon small>edit</v-icon>
                            </v-btn>
                        </v-list-tile-action>
                    </v-list-tile>
                    <v-divider v-if="index !== (rows.length - 1)"></v-divider>
                </div>
            </v-list>
        </v-card>
        <NewNetworkDialog @cancel="onCancelEdit" :editItem="editItem" v-model="dialog"/>
    </v-layout>
</template>
<script lang="ts">
    import { Vue, Component, Watch, Mixins } from 'vue-property-decorator'
    import { State } from 'vuex-class'
    import { Entities } from '../database'
    import NewNetworkDialog from './NewNetworkDialog.vue'
    import ConfirmDialog from '../components/ConfirmDialog.vue'
    import TableLoader from '../mixins/table-loader'

    @Component
    class NetworksLoader extends TableLoader<Entities.Preference> {
        tableName = GDB.preferences.name
        filter = () =>
            GDB.preferences
                .where('key')
                .equals('network')
                .reverse()
                .sortBy('id')
    }

    @Component({
        components: {
            NewNetworkDialog,
            ConfirmDialog
        }
    })
    export default class Networks extends Mixins(NetworksLoader) {
        dialog = false
        editItem: Entities.Preference | null = null

        onEdit(network: Entities.Preference) {
            this.editItem = network
            this.dialog = true
        }
        onCancelEdit() {
            this.editItem = null
        }
    }
</script>
