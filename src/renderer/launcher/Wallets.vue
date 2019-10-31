<template>
    <v-layout column align-center>
        <v-layout column style="max-width:1000px;width:100%">
            <div>
                <v-layout justify-space-between px-3 pt-1 align-center>
                    <div>
                        <h2 class="ml-3 display-1">Wallets</h2>
                    </div>
                    <div>
                        <v-btn icon flat @click="onCreate">
                            <v-icon >mdi-plus-circle-outline</v-icon>
                        </v-btn>
                        <v-btn flat icon @click="onImport">
                            <v-icon >mdi-download-outline</v-icon>
                        </v-btn>
                        <v-btn flat @click="onLedger">
                            <SvgLedger width="75px" />
                        </v-btn>
                    </div>
                </v-layout>
            </div>
            <div>
                <v-tabs centered color="transparent" slider-color="primary">
                    <v-tab class="px-2" key="local" color="gray text--dark-2">Local</v-tab>
                    <v-tab-item key="local">
                        <v-layout
                            v-if="wallets.length>0"
                            row
                            wrap
                            :justify-center="wallets.length<4"
                        >
                            <v-flex
                                v-for="wallet in wallets"
                                :key="wallet.address"
                                xs3
                                class="py-3"
                            >
                                <WalletCard
                                    flat
                                    class="card-border-thin"
                                    style="border-radius:9px;width:170px;margin:auto;"
                                    @click.native="onLoclaClick(wallet.address)"
                                    :wallet="wallet"
                                    ripple
                                ></WalletCard>
                            </v-flex>
                        </v-layout>
                        <div v-else-if="storeReady" class="text-xs-center py-5">
                            <div
                                class="headline grey--text font-weight-light"
                            >Time To Create Your Wallet!</div>
                        </div>
                    </v-tab-item>
                    <template v-for="item in ledgers">
                        <v-tab class="px-2" :key="item.publicKey">{{item.name}}</v-tab>
                        <v-tab-item :key="item.publicKey">
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
                                        @click.native="onLedgerClick(item.chainCode, index)"
                                        style="border-radius:9px;width:170px;margin:auto;"
                                        :wallet="{ name: getName(item.name, index),
                                                address: address }"
                                        ripple
                                    ></WalletCard>
                                </v-flex>
                            </v-layout>
                        </v-tab-item>
                    </template>
                </v-tabs>
            </div>
        </v-layout>
    </v-layout>
</template>
<script lang="ts">
import { Vue, Component, Watch } from 'vue-property-decorator'
import { cry } from 'thor-devkit'
import {
    ImportWalletDialog,
    CreateWalletDialog,
    ImportLedgerDialog,
    DeleteDeviceDialog,
    RenameDeviceDialog
    } from '@/renderer/components'

@Component
export default class Wallets extends Vue {
    private currentTab = 'local'
    get wallets() { return this.$store.state.wallets as entities.Wallet[] }
    get storeReady() { return this.$store.state.ready }

    get ledgers() {
        return this.$store.getters.ledgerAccounts
    }

    onLoclaClick(address: string) {
        this.$router.push({
            name: 'wallet-detail',
            params: {
                type: 'local',
                addressOrCode: address
            }
        })
    }

    onLedgerClick(chainCode: string, index: number) {
        this.$router.push({
            name: 'wallet-detail',
            params: {
                type: 'ledger',
                addressOrCode: chainCode
            },
            query: {
                index: index.toString()
            }
        })
    }

    getName(ledgerName: string, index: string) {
        return Vue.filter('ledgerName')(ledgerName, index)
    }

    onImport() {
        this.$dialog(ImportWalletDialog, null)
    }

    onCreate() {
        this.$dialog(CreateWalletDialog, undefined)
    }

    onTransfer() {
        this.$router.push({ name: 'transfer' })
    }

    onLedger() {
        this.$dialog(ImportLedgerDialog, null)
    }

    onRenameDevice(name: string, id: number) {
        this.$dialog(RenameDeviceDialog, {
            name,
            id
        })
    }

    beforeUpdate() {
        this.currentTab = 'local'
    }

    async onRemoveDevice (name: string, id: number) {
        await this.$dialog(DeleteDeviceDialog, {
            name,
            id
        })
    }
}
</script>
