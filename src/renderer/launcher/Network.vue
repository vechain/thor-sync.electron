<template>
    <v-container>
        <v-layout row justify-center>
            <v-flex sm12>
                <v-toolbar>
                    <v-toolbar-title>Networks</v-toolbar-title>
                    <v-divider class="mx-3" inset vertical></v-divider>
                    <span>
                        SYNC already built-in networks for you, you can also add a custom RPC URL on your own
                    </span>
                    <v-spacer />
                    <NewNetworkDialog />
                </v-toolbar>
                <v-data-table width="800px" :headers="headers" :items="list">
                    <template slot="items" slot-scope="props">
                        <td class="text-xs-center">{{props.item.value.name}}</td>
                        <td class="text-xs-center">{{props.item.value.type}}</td>
                        <td class="text-xs-center">{{props.item.value.rpcurl}}</td>
                    </template>
                </v-data-table>
            </v-flex>
        </v-layout>
    </v-container>
</template>
<script lang="ts">
import { Vue, Component, Watch } from 'vue-property-decorator'
import { State } from 'vuex-class'
import Preferences from '@/renderer/preferences'
import { Entities } from '../database'
import NewNetworkDialog from './NewNetworkDialog.vue'

@Component({
    components: {
        NewNetworkDialog
    }
})
export default class Networks extends Vue {
    name = 'networks'
    dialog = false
    list: Entities.Network[] = []
    headers = [
        {
            text: 'Name',
            value: 'name',
            align: 'center',
            sortable: false
        },
        {
            text: 'Type',
            value: 'domain',
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
    networksRevision!: number

    @Watch('networksRevision')
    async loadList() {
        this.list = await DB.preferences
            .filter(item => {
                return item.key === 'network'
            })
            .toArray()
    }
}
</script>
