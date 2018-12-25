<template>
    <div class="pa-3">
        <div style="max-width: 1000px; width: 100%; margin: 0 auto;">
            <div>
                <v-layout justify-center>
                    <v-btn
                        flat
                        small
                        right
                        class="caption"
                        color="primary"
                        @click="showExport"
                    >Backup</v-btn>
                    <router-link tag="span" :to="{name: 'transfer', query: {from: wallet.address}}">
                        <v-btn flat small class="caption" color="primary">transfer</v-btn>
                    </router-link>
                </v-layout>
            </div>
            <v-card class="elevation-0" v-if="wallet">
                <v-layout justify-space-around>
                    <v-flex xs9>
                        <v-list>
                            <v-list-tile avatar>
                                <v-list-tile-avatar :size="90">
                                    <AddressLabel
                                        style="width:70px;height:50px;border-radius:5px"
                                        icon
                                    >{{wallet.address}}</AddressLabel>
                                </v-list-tile-avatar>
                                <v-list-tile-content>
                                    <v-card class="elevation-0">
                                        <v-card-title
                                            style="max-width: 300px"
                                            class="d-block pa-0 pt-1 text-truncate"
                                        >{{wallet.name}}</v-card-title>
                                        <v-card-text class="caption pa-0">
                                            <v-layout row align-content-center>
                                                <v-flex align-self-center>
                                                    <AddressLabel
                                                        class="grey--text text--darken-1"
                                                    >{{wallet.address}}</AddressLabel>
                                                </v-flex>
                                                <v-flex>
                                                    <v-tooltip top>
                                                        <v-btn
                                                            class="ma-0 ml-3"
                                                            v-clipboard="wallet.address"
                                                            slot="activator"
                                                            small
                                                            icon
                                                        >
                                                            <v-icon small>mdi-content-copy</v-icon>
                                                        </v-btn>
                                                        <span>Click copy address</span>
                                                    </v-tooltip>
                                                    <QRCodeDialog
                                                        width="300"
                                                        :size="270"
                                                        :content="wallet.address"
                                                    >
                                                        <div slot="activator">
                                                            <v-tooltip top>
                                                                <v-btn
                                                                    class="ma-0"
                                                                    slot="activator"
                                                                    small
                                                                    icon
                                                                >
                                                                    <v-icon small>mdi-qrcode</v-icon>
                                                                </v-btn>
                                                                <span>Show QR code</span>
                                                            </v-tooltip>
                                                        </div>
                                                    </QRCodeDialog>
                                                </v-flex>
                                            </v-layout>
                                        </v-card-text>
                                    </v-card>
                                </v-list-tile-content>
                            </v-list-tile>
                        </v-list>
                    </v-flex>
                    <v-flex xs3>
                        <v-list class="mt-2">
                            <v-list-tile>
                                <v-divider inset vertical></v-divider>
                                <v-list-tile-content>
                                    <v-layout column style="width: 100%;">
                                        <v-flex class="text-xs-right">
                                            <Amount sym=" VET ">{{balance}}</Amount>
                                        </v-flex>
                                        <v-flex class="text-xs-right">
                                            <Amount sym=" VTHO">{{energy}}</Amount>
                                        </v-flex>
                                    </v-layout>
                                </v-list-tile-content>
                            </v-list-tile>
                        </v-list>
                    </v-flex>
                </v-layout>
            </v-card>
            <v-layout justify-space-around>
                <v-flex xs3 sm2 class="mt-3">
                    <div class="pt-1">
                        <v-btn
                            right
                            class="t-left"
                            color="primary"
                            @click="showReset"
                            flat
                            small
                        >Reset Password</v-btn>
                        <v-btn
                            right
                            class="t-left"
                            color="error"
                            flat
                            @click="showDelete"
                            small
                        >Delete</v-btn>
                    </div>
                </v-flex>
                <v-flex xs9 sm10 class="mt-1">
                    <h3
                        flat
                        v-if="list.length"
                        class="pl-0 pt-4 pb-4 title d-inline-block"
                    >Recent Transfer</h3>
                    <v-progress-circular
                        class="ml-3"
                        size="24"
                        :width="2"
                        v-if="isloading && list.length"
                        indeterminate
                        color="primary"
                    ></v-progress-circular>
                    <v-progress-linear v-if="isloading && !list.length" :indeterminate="true"></v-progress-linear>
                    <div v-if="!list.length" class="text-xs-center">
                        <div style="margin-top: 130px">
                            <v-icon
                                style="font-size: 80px"
                                color="grey lighten-2"
                                medium
                                left
                            >search</v-icon>
                            <br>
                            <span>No logs display at this time!</span>
                        </div>
                        <v-btn
                            class="mt-3"
                            small
                            :disabled="isloading"
                            color="primary"
                            @click="onLoadClick"
                        >Load</v-btn>
                    </div>
                    <div style="background: #fff">
                        <template v-for="(item, i) in list ">
                            <TransferItem
                                style="border-radios"
                                :isIn="item.sender !== address"
                                :item="item"
                                :key="i"
                            />
                            <v-divider
                                timeout="3000"
                                v-if="i !== (list.length - 1)"
                                :key="`${i}-divider`"
                                inset
                            ></v-divider>
                        </template>
                    </div>
                </v-flex>
            </v-layout>
        </div>
        <v-snackbar v-model="snackbar" color="error" top>
            {{errorMessage}}
            <v-btn flat dark @click="snackbar = false">close</v-btn>
        </v-snackbar>
    </div>
</template>
<script lang="ts">
    import { Vue, Component, Watch, Prop, Mixins } from 'vue-property-decorator'
    import TransferMixin from '../mixins/Transfer.vue'
    import { State } from 'vuex-class'
    import Store from '../store'
    import { Num } from '@/common/formatter'
    import { ResetPwdDialog } from '@/renderer/components'
    import { ExportWalletDialog } from '@/renderer/components'
    import { DeleteWalletDialog } from '@/renderer/components'
    import TransferItem from './TransferItem.vue'
    import { Entities } from '../database'
    import AccountLoader from '../mixins/account-loader'
    import { setTimeout } from 'timers'
    import { Stats } from 'fs'

    @Component({
        components: {
            TransferItem
        }
    })
    export default class WalletDetail extends Mixins(TransferMixin, AccountLoader) {
        name = 'walletDetail'
        list: Connex.Thor.Transfer[] = []
        stick = false
        snackbar = false
        errorMessage = ''
        get address() {
            return (this.wallet ? this.wallet.address : '') || ''
        }
        isloading = false

        @State
        wallets!: Entities.Wallet[]

        @State
        chainHead!: Connex.Thor.Status['head']

        @Watch('chainHead')
        onChainHeadChange() {
            if (!this.stick) {
                return
            }
            this.getList()
        }

        get wallet() {
            return this.wallets.find(item => {
                return item.address === this.$route.params.address
            })
        }

        created() {
            const address = this.$route.params.address
            if (!this.wallet) {
                this.$router.back()
            }
            this.createFilter(address)
        }

        async onLoadClick() {
            this.stick = true
            await this.getList()
        }

        showReset() {
            this.$dialog(ResetPwdDialog, this.wallet!)
        }
        showDelete() {
            this.$dialog(DeleteWalletDialog, this.wallet!)
        }
        showExport() {
            this.$dialog(ExportWalletDialog, this.wallet!)
        }
        async getList() {
            let list: Connex.Thor.Transfer[] = []
            this.resetPage()
            try {
                this.isloading = true
                list = await this.getTransferDesc(10)
                this.isloading = false
            } catch (error) {
                this.errorMessage = `${error.name}: ${error.message}`
                this.list = []
                this.snackbar = true
                return
            }

            this.list = list
        }

        get balance() {
            return this.account && this.account.balance
        }

        get energy() {
            return this.account && this.account.energy
        }
    }
</script>

<style>
    .t-left .v-btn__content {
        justify-content: left;
    }
</style>
