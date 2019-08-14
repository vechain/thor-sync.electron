<template>
    <div class="px-3" v-if="wallet">
        <div style="max-width: 900px; width: 100%; margin: 0 auto;">
            <v-layout justify-center py-3>
                <a class="top-link" @click="showReset">Reset Password</a>
                <a class="top-link" @click="showExport">Backup</a>
                <a class="top-link" @click="showTransfer">Transfer</a>
                <a class="top-link error--text" @click="showDelete">Delete</a>
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
            <div class="py-3">
                <div class="my-2 subheading">Activities</div>
                <template v-if="list && list.length >0">
                    <v-card flat class="card-border">
                        <v-data-table
                            :headers="herders"
                            :items="list"
                            :rows-per-page-items="[10, 15, 20, {text: 'All', value: -1}]"
                        >
                            <template slot="items" slot-scope="props">
                                <td class="text-xs-left">
                                    <Tooltip top>
                                        <v-btn
                                            slot="activator"
                                            icon
                                            small
                                            flat
                                            @click.stop="resend(props.item.id)"
                                            class="my-0"
                                            style="margin-right:-8px;"
                                            :style="{'pointer-events': props.item.status.icon === 'mdi-restart' ? '' : 'none'}"
                                        >
                                            <v-icon
                                                small
                                                :color="props.item.status.color"
                                            >{{props.item.status.icon}}</v-icon>
                                        </v-btn>
                                        <span>{{props.item.status.desc}}</span>
                                    </Tooltip>
                                    <b
                                        v-if="props.item.reverted"
                                        style="display: inline-flex; vertical-align: text-bottom; margin-left: 5px;"
                                        class="label warning"
                                    >Reverted</b>
                                </td>
                                <td class="text-xs-left">{{props.item.time| dateTime}}</td>
                                <td class="text-xs-left">
                                    <b
                                        :class="{
                                            'mr-1': props.item.type === 'TX',
                                            primary: props.item.type === 'TX',
                                            secondary: props.item.type !== 'TX'
                                        }"
                                        style="display: inline-block"
                                        class="label"
                                    >{{props.item.type}}</b>
                                </td>
                                <td class="text-xs-left">{{props.item.category}}</td>
                                <td class="text-xs-left">
                                    <a
                                        v-if="!!props.item.link.name"
                                        @click="reveal(props.item.link.url)"
                                        class="caption text-truncate"
                                    >
                                        <v-icon
                                            style="font-size:100%;color:currentColor"
                                        >mdi-link-variant</v-icon>
                                        {{props.item.link.name}}
                                    </a>
                                </td>
                                <td class="text-xs-left">
                                    <v-btn
                                        :ripple="false"
                                        @click="insight(props.item.txId)"
                                        v-if="props.item.txId && props.item.receipt"
                                        icon
                                        flat
                                        small
                                    >
                                        <v-icon small color="blue">search</v-icon>
                                    </v-btn>
                                    <v-btn
                                        @click.stop="showComment(props.item.comment)"
                                        :ripple="false"
                                        small
                                        v-if="props.item.comment"
                                        icon
                                        flat
                                    >
                                        <v-icon color="blue" small>mdi-message-outline</v-icon>
                                    </v-btn>
                                </td>
                            </template>
                        </v-data-table>
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
                                <div class="subheading">No activities at this time!</div>
                            </template>
                        </div>
                    </div>
                </template>
            </div>
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
    ExportWalletDialog,
    ContentDialog
} from '@/renderer/components'
import AccountLoader from '../mixins/account-loader'
import TableLoader from '../mixins/table-loader'
import { remote } from 'electron'

type ActivityItem = {
    id: number,
    status: {
        icon: string,
        color: string,
        desc: string
    },
    reverted: boolean,
    time: number,
    receipt: Connex.Thor.Receipt | null,
    type: 'TX' | 'CERT',
    category: 'Create' | 'Multi' | 'Call' | 'Transfer' | 'Identification' | 'Agreement',
    link: {
        name: string,
        url: string
    },
    txId: string,
    comment: string
}

@Component
class ActivitiesLoader extends TableLoader<entities.Activity<'tx' | 'cert'>, number> {
}
@Component
export default class WalletDetail extends Mixins(ActivitiesLoader, AccountLoader) {
    textTip = 'Copy'
    editing = false
    editingName = ''
    loading = false
    error: Error | null = null
    herders = [
        {
            text: 'Status',
            value: 'status',
            sortable: false,
            align: 'left'
        }, {
            text: 'Date',
            value: 'time',
            sortable: false,
            align: 'left'
        }, {
            text: 'Type',
            value: 'type',
            sortable: false,
            align: 'left'
        }, {
            text: 'Category',
            value: 'category',
            sortable: false,
            align: 'left'
        }, {
            text: 'Link',
            value: 'link',
            sortable: false,
            align: 'left'
        }, {
            sortable: false,
            text: ''
        }
    ]

    @State
    wallets!: entities.Wallet[]
    @State
    txResendTime!: { [id: string]: number }

    table = BDB.activities

    get wallet() {
        return this.wallets.find(item => {
            return item.address === this.$route.params.address
        })
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

    get list(): ActivityItem[] {
        this.$store.state.syncStatus
        return this.rows.map((item: entities.Activity<'tx' | 'cert'>) => {
            return {
                id: item.id,
                status: item.type === 'tx' ? this.getTxStatus(item as entities.Activity<'tx'>, this.$store.state.chainHead.timestamp)
                    : {
                        icon: 'mdi-check-circle-outline',
                        color: 'success',
                        desc: 'Confirmed'
                    },
                reverted: item.type === 'tx' && (item as entities.Activity<'tx'>).data.receipt ? (item as entities.Activity<'tx'>).data.receipt!.reverted : false,
                time: item.createdTime,
                type: item.type === 'tx' ? 'TX' : 'CERT',
                receipt: item.type === 'tx' ? (item as entities.Activity<'tx'>).data.receipt : null,
                category: this.getCategory(item),
                link: {
                    name: Vue.filter('hostnameOf')(item.referer.url),
                    url: this.getLinkUrl(item),
                },
                txId: item.type === 'tx' ? item.data.id : null,
                comment: item.type !== 'tx' ? (item as entities.Activity<'cert'>).data.message.payload.content : null
            } as ActivityItem
        })
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

    getStatus(item: entities.Activity<'tx'>, headTs: number) {
        if (item.data.receipt) {
            return item.closed ? 'confirmed' : 'confirming'
        } else if (item.closed) {
            return 'dropped'
        }

        const qStatus = remote.app.EXTENSION.txer.status(item.data.id)
        if (!qStatus) {
            return 'hanging'
        }
        if (qStatus === 'error') {
            return 'error'
        }

        const sendTime = this.txResendTime[item.data.id] || item.data.timestamp
        if (qStatus === 'sent' && headTs > sendTime + 10 * 6) {
            return 'timeout'
        }
    }

    getTxStatus(item: entities.Activity<'tx'>, headTs: number) {
        let status = this.getStatus(item, headTs)
        let icon = ''
        let color = ''
        let desc = ''
        switch (status) {
            case 'confirmed': icon = 'mdi-check-circle-outline'
                break;
            case 'confirming': icon = 'mdi-progress-check'
                break;
            case 'sending': icon = 'mdi-progress-upload'
                break;
            case 'dropped': icon = 'mdi-alert-circle-outline'
                break;
            default: icon = 'mdi-restart'
                break;
        }

        switch (status) {
            case 'confirmed': color = 'success'
                break;
            case 'confirming': color = 'info'
                break;
            case 'sending': color = 'info'
                break;
            default: color = 'error'
                break;
        }

        switch (status) {
            case 'confirmed': desc = 'Confirmed'
                break;
            case 'confirming': desc = 'Confirming...'
                break;
            case 'sending': desc = 'Sending...'
                break;
            case 'dropped': desc = 'Dropped'
                break;
            default: desc = 'Click to retry'
                break;
        }

        return {
            icon,
            desc,
            color
        }
    }

    resend(id: number) {
        const temp = this.rows.find((row) => {
            return row.id === id
        }) as entities.Activity<'tx'>

        remote.app.EXTENSION.txer.enqueue(temp.data.id, temp.data.raw, NODE_CONFIG.url)
        this.$store.commit('updateTxResendTime', { id: temp.data.id, value: Date.now() / 1000 })
        // this.$set(this.$store.state.txResendTime, temp.data.id, Date.now() / 1000)
    }

    getCategory(item: entities.Activity<'tx' | 'cert'>): string {
        let result: string = ''
        if (item.type === 'tx') {
            const data = item.data as entities.Activity.Tx
            if (data.message.length > 1) {
                result = 'Multi'
            } else {
                const msg = data.message[0]
                if (msg.data && msg.data !== '0x' && msg.to) {
                    result = 'Call'
                } else if (msg.to && (!msg.data || msg.data === '0x')) {
                    result = 'Transfer'
                } else if (!msg.to) {
                    result = 'Create'
                }
            }
        } else {
            const data = item.data as entities.Activity.Cert
            result = data.message.purpose === 'identification' ? 'Identification' : 'Agreement'
        }

        return result
    }

    getLinkUrl(item: entities.Activity<'tx' | 'cert'>) {
        let href: string
        if (item.data.link) {
            href = item.data.link.replace('{txid}', item.data.id)
        } else {
            href = item.referer.url
        }

        return href
    }

    reveal(url: string) {
        BUS.$emit('open-tab', { href: url })
    }

    insight(id: string) {
        const href = `https://insight.vecha.in/#/txs/${id}`
        BUS.$emit('open-tab', { href })
    }

    showComment(msg: string) {
        this.$dialog(ContentDialog, {
            title: 'Signed Content',
            content: msg,
            contentClass: 'cert-msg-dialog'
        })
    }

    viewTransferLogs() {
        const href = `https://insight.vecha.in/#/accounts/${this.address}/transfers`
        BUS.$emit('open-tab', { href })
    }

    created() {
        this.walletChanged()
        this.filter = () => {
            return BDB.activities.orderBy('createdTime').reverse()
                .filter((item: entities.Activity<'tx' | 'cert'>): boolean => {
                    return item.data.signer.toLowerCase() === this.address.toLowerCase()
                }).toArray()
        }
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
</style>
