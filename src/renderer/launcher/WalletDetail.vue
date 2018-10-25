<template>
    <v-container>
        <v-layout row wrap="" justify-center>
            <v-flex sm10 md10 lg8>
                <v-card v-if="wallet">
                    <v-list>
                        <v-list-tile avatar>
                            <v-list-tile-avatar :size="90">
                                <AddressLabel :size="50" icon>{{wallet.address}}</AddressLabel>
                            </v-list-tile-avatar>
                            <v-list-tile-content>
                                <v-list-tile-title>{{wallet.name}}</v-list-tile-title>
                                <v-list-tile-sub-title>
                                    <AddressLabel>{{wallet.address}}</AddressLabel>
                                </v-list-tile-sub-title>
                            </v-list-tile-content>
                        </v-list-tile>
                    </v-list>
                    <v-layout row>
                        <v-flex sm6 class="text-sm-center headline">
                            <Amount sym=" VET">{{balance}}</Amount>
                        </v-flex>
                        <v-flex sm6 class="text-sm-center headline">
                            <Amount sym=" VTHO">{{energy}}</Amount>
                        </v-flex>
                    </v-layout>
                </v-card>
            </v-flex>
            <v-flex class="mt-3" sm12 md10 lg8>
                <v-toolbar class="elevation-0">
                    <v-toolbar-title>Transfer Log</v-toolbar-title>
                </v-toolbar>
                <v-data-table :loading="isloading" hide-actions :headers="headers" :items="list">
                    <v-progress-linear slot="progress" color="blue" indeterminate></v-progress-linear>
                    <template slot="items" slot-scope="props">
                        <td class="text-xs-center">{{props.item.meta.blockTimestamp | date}}</td>
                        <td class="text-xs-center">{{props.item.meta.txID | shortTxHas}}</td>
                        <td class="text-xs-center">{{props.item.meta.blockNumber.toLocaleString()}}</td>
                        <td class="text-xs-center">{{props.item.sender | shortAddr}}</td>
                        <td class="text-xs-center">{{props.item.recipient | shortAddr}}</td>
                        <td class="text-xs-center">{{props.item.amount | balance}}</td>
                    </template>
                </v-data-table>
            </v-flex>
        </v-layout>
    </v-container>
</template>
<script lang="ts">
import { Vue, Component, Watch, Prop, Mixins } from 'vue-property-decorator'
import TransferMixin from '../mixin/Transfer.vue'
import { State } from 'vuex-class'
import Store from '../store'
import Amount from '../components/Amount.vue'
import AddressLabel from '../components/AddressLabel.vue'
import { Num } from '@/common/formatter'
import { Entities } from '../database'
@Component({
    components: {
        Amount,
        AddressLabel
    }
})
export default class WalletDetail extends Mixins(TransferMixin) {
    name = 'walletDetail'
    wallet: any = null
    list: Connex.Thor.Transfer[] = []
    @State
    walletsRevision!: number
    address: string = ''
    isloading = true

    untrack = () => {}

    destroyed() {
        this.untrack()
    }

    headers = [
        {
            text: 'Date',
            align: 'center',
            sortable: false
        },
        {
            text: 'TxID',
            align: 'center',
            sortable: false
        },
        {
            text: 'Block #',
            align: 'center',
            sortable: false
        },
        {
            text: 'From',
            align: 'center',
            sortable: false
        },
        {
            text: 'To',
            align: 'center',
            sortable: false
        },
        {
            text: 'Value',
            align: 'center',
            sortable: false
        }
    ]

    async created() {
        this.address = this.$route.params.address
        this.loadWallet()
        this.createFilter(this.address)
        this.list = await this.getTransferDesc(10)
        this.isloading = false
    }

    @Watch('walletsRevision')
    async loadWallet() {
        this.wallet = await DB.wallets
            .where('address')
            .equalsIgnoreCase(this.address)
            .first()
    }

    get account() {
        // untrack previously tracked
        this.untrack()

        const tracker = this.$store.getters.account(this.wallet.address)
        // settle untrack method
        this.untrack = () => {
            tracker.untrack()
            this.untrack = () => {}
        }
        return tracker.account as Store.Account
    }

    get balance() {
        return this.account.data && this.account.data.balance
    }

    get energy() {
        return this.account.data && this.account.data.energy
    }
}
</script>

