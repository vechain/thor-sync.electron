<template>
    <v-container>
        <v-layout row justify-center>
            <v-flex sm12>
                <v-toolbar>
                    <v-toolbar-title>Networks</v-toolbar-title>
                    <v-divider class="mx-3" inset vertical></v-divider>
                    <span>SYNC already built-in networks for you, you can also add a custom RPC URL on your own</span>
                    <v-spacer/>
                    <NewNetworkDialog
                        @cancel="onCancelEdit"
                        :editItem="editItem"
                        v-model="dialog"
                    />
                </v-toolbar>
                <v-data-table hide-actions width="800px" :headers="headers" :items="rows">
                    <template slot="items" slot-scope="props">
                        <td class="text-xs-center">{{props.item.value.name}}</td>
                        <td class="text-xs-center">{{props.item.value.rpcUrl}}</td>
                        <td class="text-xs-center">
                            <v-btn
                                dark
                                small
                                icon
                                color="blue-grey lighten-3"
                                @click="onEdit(props.item)"
                            >
                                <v-icon small>edit</v-icon>
                            </v-btn>
                            <v-btn
                                @click="onDelete(props.item)"
                                dark
                                small
                                icon
                                color="blue-grey lighten-3"
                            >
                                <v-icon small>delete</v-icon>
                            </v-btn>
                        </td>
                    </template>
                </v-data-table>
            </v-flex>
        </v-layout>
        <ConfirmDialog max-width="300px" ref="confirm"/>
    </v-container>
</template>
<script lang="ts">
import { Vue, Component, Watch, Mixins } from 'vue-property-decorator'
import { State } from 'vuex-class'
import { Entities } from '../database'
import NewNetworkDialog from './NewNetworkDialog.vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'
import TableLoader from '../mixins/table-loader'

@Component
class NetworksLoader extends TableLoader<Entities.Preference>{
    tableName = DB.preferences.name
    filter = () => DB.preferences
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

    headers = [
        {
            text: 'Name',
            value: 'name',
            align: 'center',
            sortable: false
        },
        {
            text: 'RPC URL',
            value: 'name',
            align: 'center',
            sortable: false
        },
        {
            text: 'Actions',
            value: 'name',
            align: 'center',
            sortable: false
        }
    ]

    onEdit(network: Entities.Preference) {
        this.editItem = network
        this.dialog = true
    }

    async onDelete(item: Entities.Preference) {
        let conDig = this.$refs.confirm as ConfirmDialog
        conDig.confirm().then(
            () => {
                return DB.preferences.delete(item.id!)
            },
            () => {
                console.log('cancel')
            }
        )
    }
    onCancelEdit() {
        this.editItem = null
    }
}
</script>
