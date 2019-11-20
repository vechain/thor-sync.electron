<template>
    <div>
        <div v-if="currentTab === 'local'">
            <v-layout v-if="wallets.length>0" row wrap :justify-center="wallets.length<4">
                <v-flex v-for="wallet in wallets" :key="wallet.address" xs3 class="py-3">
                    <WalletCard
                        flat
                        class="card-border-thin"
                        style="border-radius:9px;width:170px;margin:auto;"
                        @click.native="onLoclaClick(wallet.id)"
                        :wallet="wallet"
                        ripple
                    ></WalletCard>
                </v-flex>
            </v-layout>
            <div v-else-if="storeReady" class="text-xs-center py-5">
                <div class="headline grey--text font-weight-light">Time To Create Your Wallet!</div>
            </div>
        </div>
        <template v-for="item in ledgers">
            <div v-if="currentTab === item.publicKey" :key="item.publicKey">
                <v-layout justify-center align-center>
                    <v-btn
                        color="primary"
                        small
                        flat
                        @click="onRenameDevice(item.name, item.id)"
                    >Rename</v-btn>
                    <v-btn
                        color="error"
                        small
                        flat
                        @click="onRemoveDevice(item.name, item.id)"
                    >Remove</v-btn>
                </v-layout>
                <v-layout row wrap>
                    <v-flex
                        v-for="(address, index) in item.accounts"
                        :key="address"
                        xs3
                        class="py-3"
                    >
                        <WalletCard
                            flat
                            class="card-border-thin"
                            @click.native="onLedgerClick(item.publicKey, index)"
                            style="border-radius:9px;width:170px;margin:auto;"
                            :wallet="{ name: getName(item.name, index),
                                                address: address }"
                            ripple
                        ></WalletCard>
                    </v-flex>
                </v-layout>
            </div>
        </template>
    </div>
</template>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'
import {
    DeleteDeviceDialog,
    RenameDeviceDialog
} from '@/renderer/components'
@Component
export default class WalletsList extends Vue {

    get wallets() { return this.$store.state.wallets as entities.Wallet[] }
    get storeReady() { return this.$store.state.ready }
    get currentTab() {
        return this.$route.params.group
    }

    get ledgers() {
        return this.$store.getters.ledgerAccounts
    }

    async onRemoveDevice(name: string, id: number) {
        await this.$dialog(DeleteDeviceDialog, {
            name,
            id
        })
    }

    onLoclaClick(id: string) {
        this.$router.push({
            name: 'wallet-detail',
            params: {
                group: 'local',
                indexOrId: id
            }
        })
    }

    onLedgerClick(publicKey: string, index: number) {
        this.$router.push({
            name: 'wallet-detail',
            params: {
                group: publicKey,
                indexOrId: index.toString()
            }
        })
    }

    onRenameDevice(name: string, id: number) {
        this.$dialog(RenameDeviceDialog, {
            name,
            id
        })
    }

    getName(ledgerName: string, index: string) {
        return Vue.filter('ledgerName')(ledgerName, index)
    }
}
</script>
