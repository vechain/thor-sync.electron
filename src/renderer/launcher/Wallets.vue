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
                            <v-icon>mdi-plus-circle-outline</v-icon>
                        </v-btn>
                        <v-btn flat icon @click="onImport">
                            <v-icon>mdi-download-outline</v-icon>
                        </v-btn>
                        <v-btn flat @click="onLedger">
                            <SvgLedger width="75px" />
                        </v-btn>
                    </div>
                </v-layout>
            </div>
            <div>
                <div class="tabs text-xs-center">
                    <span
                        :class="{active: currentTab === 'local'}"
                        @click="onTabChange('local')"
                        v-ripple
                        class="d-inline-block mx-2 pa-2 title gray text--dark-2 font-weight-regular"
                    >
                        Local
                        <span></span>
                    </span>
                    <span
                        :class="{active: currentTab === item.publicKey}"
                        @click="onTabChange(item.publicKey)"
                        v-ripple
                        class="d-inline-block mx-2 pa-2 title gray text--dark-2 font-weight-regular"
                        v-for="item in ledgers"
                        :key="item.publicKey"
                    >
                        {{item.name}}
                        <span></span>
                    </span>
                </div>
                <transition
                    mode="out-in"
                    :enter-active-class="`animated faster slide-in`"
                    :leave-active-class="`animated faster fade-out`"
                >
                    <div v-if="currentTab === 'local'">
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
                                        @click.native="onLedgerClick(item.chainCode, index)"
                                        style="border-radius:9px;width:170px;margin:auto;"
                                        :wallet="{ name: getName(item.name, index),
                                                address: address }"
                                        ripple
                                    ></WalletCard>
                                </v-flex>
                            </v-layout>
                        </div>
                    </template>
                </transition>
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
    currentTab: string = 'local'
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

    onTabChange(key: string) {
        this.currentTab = key
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

    @Watch('ledgers')
    onChange(v: any[], ov: any[]) {
        if (v.length !== ov.length) {
            this.currentTab = this.ledgers.length ? this.ledgers[this.ledgers.length - 1].publicKey : 'local'
        }
    }

    async onRemoveDevice(name: string, id: number) {
        await this.$dialog(DeleteDeviceDialog, {
            name,
            id
        })
    }
}
</script>

<style scoped>
.tabs > span {
    position: relative;
    opacity: 0.7;
}
.tabs > span.active {
    opacity: 1;
}
.tabs span span {
    display: block;
    height: 2px;
    bottom: -2px;
    position: absolute;
    margin: auto;
    left: -8px;
    width: calc(100% + 16px);
}
.tabs span span::after {
    content: "";
    display: block;
    width: 0;
    opacity: 0;
    height: 100%;
    background-color: #1976d2;
    margin: auto;
    transition: all 0.2s ease-in-out;
}
.tabs span.active span::after {
    opacity: 0.87;
    width: 100%;
}
</style>
