<template>
    <div class="px-3" v-if="wallet">
        <div style="max-width: 900px; width: 100%; margin: 0 auto;">
            <v-layout justify-center py-3>
                <a class="top-link" @click="showReset">Reset Password</a>
                <a class="top-link" @click="showExport">Backup</a>
                <a class="top-link" @click="showTransfer">Transfer</a>
                <a class="top-link error--text" @click="showDelete">Delete</a>
            </v-layout>
            <v-card flat style="border: 1px solid rgba(0,0,0,0.1)">
                <v-card-text>
                    <v-layout align-center>
                        <AddressLabel
                            class="mr-3"
                            style="width:75px;height:50px;border-radius:5px"
                            icon
                        >{{wallet.address}}</AddressLabel>
                        <div>
                            <v-layout align-center>
                                <input
                                    single-line
                                    class="editable-name headline px-1"
                                    style="margin-left:-4px"
                                    hide-details
                                    v-focus
                                    v-if="editing"
                                    maxlength="20"
                                    @keypress.enter="saveName(); editing=false"
                                    @keyup.esc="editing=false"
                                    @blur="editing=false"
                                    v-model="editingName"
                                >
                                <span v-else class="headline">{{wallet.name}}</span>
                                <v-btn
                                    icon
                                    small
                                    class="ml-3 my-0"
                                    @mousedown.prevent
                                    @click="editing? saveName(): editingName=wallet.name;editing=!editing"
                                >
                                    <v-icon small>{{editing? 'mdi-check':'mdi-square-edit-outline'}}</v-icon>
                                </v-btn>
                            </v-layout>
                            <v-layout align-center>
                                <AddressLabel style="font-size:95%">{{wallet.address}}</AddressLabel>
                                <v-tooltip top open-delay="600" transition="fade-transition">
                                    <v-btn
                                        class="my-0 ml-3 mr-0"
                                        v-clipboard="wallet.address"
                                        @click="textTip = 'Copied'"
                                        @mouseover="textTip = 'Copy'"
                                        slot="activator"
                                        small
                                        icon
                                    >
                                        <v-icon style="font-size:110%">mdi-content-copy</v-icon>
                                    </v-btn>
                                    <span>{{textTip}}</span>
                                </v-tooltip>
                                <QRCodeDialog width="300" :size="270" :content="wallet.address">
                                    <div slot="activator">
                                        <v-tooltip
                                            top
                                            open-delay="600"
                                            transition="fade-transition"
                                        >
                                            <v-btn class="my-0" slot="activator" small icon>
                                                <v-icon small>mdi-qrcode</v-icon>
                                            </v-btn>
                                            <span>Show QR code</span>
                                        </v-tooltip>
                                    </div>
                                </QRCodeDialog>
                            </v-layout>
                        </div>
                        <v-spacer/>
                        <v-divider vertical/>
                        <v-layout column align-end class="subheading">
                            <Amount sym=" VET ">{{balance}}</Amount>
                            <Amount sym=" VTHO">{{energy}}</Amount>
                        </v-layout>
                    </v-layout>
                </v-card-text>
            </v-card>
            <div class="py-3">
                <template v-if="list && list.length >0">
                    <div class="my-2 subheading">Recent Trasfers</div>
                    <v-card flat style="border: 1px solid rgba(0,0,0,0.1)">
                        <v-list>
                            <template v-for="(item, i) in list ">
                                <TransferItem :address="address" :item="item" :key="i"/>
                                <v-divider
                                    v-if="i !== (list.length - 1)"
                                    :key="`${i}-divider`"
                                    inset
                                ></v-divider>
                            </template>
                        </v-list>
                    </v-card>
                </template>
                <template v-else>
                    <div class="text-xs-center">
                        <div style="margin-top: 130px">
                            <v-icon style="font-size: 80px" color="grey lighten-2">search</v-icon>
                            <div
                                v-if="error"
                                class="error--text"
                            >{{`${error.name}: ${error.message}`}}</div>
                            <template v-else>
                                <div class="subheading" v-if="!list">Recent Trasfers</div>
                                <div v-else class="subheading">No transfer log at this time!</div>
                            </template>
                        </div>
                        <v-btn
                            v-show="!list"
                            class="mt-3"
                            :disabled="loading"
                            :loading="loading"
                            color="primary"
                            @click="onLoadClick"
                        >Load</v-btn>
                    </div>
                </template>
            </div>
        </div>
    </div>
</template>
<script lang="ts">
import { Vue, Component, Watch, Prop, Mixins } from 'vue-property-decorator'
import TransferMixin from '../mixins/Transfer.vue'
import { State } from 'vuex-class'
import Store from '../store'
import { ResetPwdDialog } from '@/renderer/components'
import { ExportWalletDialog } from '@/renderer/components'
import { DeleteWalletDialog } from '@/renderer/components'
import TransferItem from './TransferItem.vue'
import AccountLoader from '../mixins/account-loader'

@Component({
    components: {
        TransferItem
    }
})
export default class WalletDetail extends Mixins(TransferMixin, AccountLoader) {
    list: Connex.Thor.Transfer[] | null = null
    textTip = 'Copy'
    editing = false
    editingName = ''

    loading = false
    error: Error | null = null

    @State
    wallets!: entities.Wallet[]

    get wallet() {
        return this.wallets.find(item => {
            return item.address === this.$route.params.address
        })
    }

    get address() { return (this.wallet ? this.wallet.address : '') || '' }
    get balance() { return this.account && this.account.balance }
    get energy() { return this.account && this.account.energy }

    @Watch('wallet')
    walletChanged() {
        if (!this.wallet) {
            if (this.$router.history.index) {
                this.$router.back()
            } else {
                this.$router.push({ name: 'portal' })
            }
        }
    }

    @State
    chainHead!: Connex.Thor.Status['head']

    @Watch('chainHead')
    onChainHeadChange() {
        if (this.list) {
            this.reload()
        }
    }

    created() {
        this.walletChanged()
        this.createFilter(this.address)
    }

    onLoadClick() {
        this.reload()
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
    async reload() {
        if (this.loading) {
            return
        }
        this.resetPage()
        try {
            this.error = null
            this.loading = true

            this.list = await this.getTransferDesc(10)
        } catch (error) {
            this.error = error
        } finally {
            this.loading = false
        }
    }

    showTransfer() {
        this.$router.push({ name: 'transfer', query: { from: this.wallet!.address } })
    }

    saveName() {
        if (!this.wallet) {
            return
        }

        if (this.wallet.name !== this.editingName) {
            BDB.wallets
                .where('id')
                .equals(this.wallet.id!)
                .modify({ name: this.editingName })
        }
    }
}
</script>
<style scoped>
input.editable-name {
    outline: none;
    box-shadow: 0px 0px 0px 2px #1976d2;
    border-radius: 2px;
}
</style>
