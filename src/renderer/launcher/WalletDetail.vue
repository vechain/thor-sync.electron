<template>
    <div class="px-3" v-if="wallet">
        <div style="max-width: 900px; width: 100%; margin: 0 auto;">
            <v-layout justify-center py-3>
                <a v-if="isLocal" class="top-link" @click="showReset">Reset Password</a>
                <a v-if="isLocal" class="top-link" @click="showExport">Backup</a>
                <a class="top-link" @click="showTransfer">Transfer</a>
                <a v-if="isLocal" class="top-link error--text" @click="showDelete">Delete</a>
            </v-layout>
            <v-card flat class="card-border">
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
                                />
                                <span v-else class="headline">{{wallet.name}}</span>
                                <v-btn
                                    v-if="isLocal"
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
                                <Tooltip top>
                                    <v-btn
                                        class="my-0 ml-3 mr-0"
                                        v-clipboard="checksum"
                                        @click="textTip = 'Copied'"
                                        @mouseover="textTip = 'Copy'"
                                        slot="activator"
                                        small
                                        icon
                                    >
                                        <v-icon style="font-size:110%">mdi-content-copy</v-icon>
                                    </v-btn>
                                    <span>{{textTip}}</span>
                                </Tooltip>
                                <QRCodeDialog width="300" :size="270" :content="wallet.address">
                                    <div slot="activator">
                                        <Tooltip top>
                                            <v-btn class="my-0" slot="activator" small icon>
                                                <v-icon small>mdi-qrcode</v-icon>
                                            </v-btn>
                                            <span>Show QR code</span>
                                        </Tooltip>
                                    </div>
                                </QRCodeDialog>
                                <Tooltip top>
                                    <v-btn
                                        class="my-0"
                                        slot="activator"
                                        icon
                                        small
                                        @click="viewTransferLogs"
                                    >
                                        <v-icon small>mdi-file-find-outline</v-icon>
                                    </v-btn>
                                    <span>View transfer logs</span>
                                </Tooltip>
                            </v-layout>
                        </div>
                        <v-spacer />
                        <v-divider vertical />
                        <v-layout column align-end class="subheading">
                            <Amount sym=" VET ">{{balance}}</Amount>
                            <Amount sym=" VTHO">{{energy}}</Amount>
                        </v-layout>
                    </v-layout>
                </v-card-text>
            </v-card>
            <ActivitiesTable :address="address" />
        </div>
    </div>
</template>
<script lang="ts">
import { Vue, Component, Watch, Prop, Mixins } from 'vue-property-decorator'
import { State } from 'vuex-class'
import Store from '../store'
import {
    ResetPwdDialog,
    UnlockWalletDialog,
    DeleteWalletDialog,
    ExportWalletDialog
} from '@/renderer/components'
import AccountLoader from '../mixins/account-loader'
import { remote } from 'electron'
@Component
export default class WalletDetail extends Mixins(AccountLoader) {
    textTip = 'Copy'
    editing = false
    editingName = ''

    @State
    wallets!: entities.Wallet[]
    @State
    txResendTime!: { [id: string]: number }

    get isLocal() {
        return this.$route.params.type === 'local'
    }

    get pk() {
        return this.$route.params.addressOrCode
    }

    get wallet() {
        let result: any
        if (this.isLocal) {
            result = this.wallets.find(item => {
                return item.address === this.pk
            })
        } else {
            let temp = this.$store.getters.ledgerAccounts.find((item: any) => {
                return item.chainCode === this.pk
            })
            result = {
                address: temp.accounts[this.$route.query.index],
                name: Vue.filter('ledgerName')(temp.name, this.$route.query.index)
            }
        }
        return result
    }

    get checksum() {
        return Vue.filter('checksum')(this.address)
    }
    get address() {
        return (this.wallet ? this.wallet.address : '') || ''
    }
    get balance() {
        return this.account && this.account.balance
    }
    get energy() {
        return this.account && this.account.energy
    }

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

    viewTransferLogs() {
        const href = `https://insight.vecha.in/#/accounts/${this.address}/transfers`
        BUS.$emit('open-tab', { href })
    }

    created() {
        this.walletChanged()
    }

    async showReset() {
        try {
            const privateKey = await this.$dialog(UnlockWalletDialog, {
                wallet: this.wallet!
            })
            if (privateKey) {
                this.$dialog(ResetPwdDialog, {
                    privateKey: privateKey,
                    id: this.wallet!.id
                })
            }
        } catch (error) {
            LOG.error(error)
        }
    }

    async showDelete() {
        try {
            const privateKey = await this.$dialog(UnlockWalletDialog, {
                wallet: this.wallet!
            })
            if (privateKey) {
                this.$dialog(DeleteWalletDialog, {
                    id: this.wallet!.id,
                    name: this.wallet!.name
                })
            }
        } catch (error) {
            LOG.error(error)
        }
    }

    async showExport() {
        try {
            const pk = await this.$dialog(UnlockWalletDialog, {
                wallet: this.wallet!
            })
            if (pk) {
                this.$dialog(ExportWalletDialog, this.wallet!)
            }
        } catch (error) {
            LOG.error(error)
        }
    }

    showTransfer() {
        this.$router.push({
            name: 'transfer',
            query: { from: this.wallet!.address }
        })
    }

    saveName() {
        if (!this.wallet) {
            return
        }
        const newName = this.editingName.trim()
        if (!newName || newName === this.wallet.name) {
            return
        }

        BDB.wallets
            .where('id')
            .equals(this.wallet.id!)
            .modify({ name: newName })
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
<style>
.cert-msg-dialog .v-card__text > div {
    max-height: 296px;
    overflow: auto;
    padding: 15px 10px;
    border-radius: 2px;
    background-color: #efefef;
}
.cert-msg-dialog .theme--dark .v-card__text > div {
    background-color: #505050;
}
</style>
