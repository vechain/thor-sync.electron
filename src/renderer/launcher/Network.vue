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
                        @updated="onUpdate"
                        :editItem="editItem"
                        v-model="dialog"
                    />
                </v-toolbar>
                <v-data-table width="800px" :headers="headers" :items="list">
                    <template slot="items" slot-scope="props">
                        <td class="text-xs-center">{{props.item.value.name}}</td>
                        <td class="text-xs-center">{{props.item.value.rpcurl}}</td>
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
                            <v-btn @click="onDelete(props.item)" dark small icon color="blue-grey lighten-3">
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
import { Vue, Component, Watch } from 'vue-property-decorator'
import { State } from 'vuex-class'
import Preferences from '@/renderer/preferences'
import { Entities } from '../database'
import NewNetworkDialog from './NewNetworkDialog.vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'

@Component({
    components: {
        NewNetworkDialog,
        ConfirmDialog
    }
})
export default class Networks extends Vue {
    name = 'networks'
    dialog = false
    editItem: Entities.Network | null = null
    list: Entities.Network[] = []
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

    created() {
        this.loadList()
    }
    @State
    preferenceRevision!: number

    @Watch('preferenceRevision')
    async loadList() {
        this.list = await DB.preferences
            .where('key')
            .equals('network')
            .reverse()
            .sortBy('id')
    }

    onEdit(network: Entities.Network) {
        this.editItem = network
        this.dialog = true
    }

    async onDelete(item: Entities.Network) {
        let conDig = this.$refs.confirm as ConfirmDialog
        conDig.confirm().then(
            () => {
                return DB.preferences.delete(item.id as any)
            },
            () => {
                console.log('cancel')
            }
        )
    }

    onUpdate(network: Entities.Network) {
        const index = this.list.findIndex(item => {
            return item.id === network.id
        })

        this.$set(this.list, index, network)
    }
    onCancelEdit() {
        this.editItem = null
    }
}
</script>
