<template>
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
                                <v-icon style="font-size:100%;color:currentColor">mdi-link-variant</v-icon>
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
                    <div v-if="error" class="error--text">{{`${error.name}: ${error.message}`}}</div>
                    <template v-else>
                        <div class="subheading">No activities at this time!</div>
                    </template>
                </div>
            </div>
        </template>
    </div>
</template>
<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
import { State } from 'vuex-class'
import TableLoader from '../mixins/table-loader'
import { remote } from 'electron'
import {
    ContentDialog
} from '@/renderer/components'

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
export default class ActivitiesTable extends TableLoader<entities.Activity<'tx' | 'cert'>, number> {
    @Prop(String)
    address?: string

    @State
    txResendTime!: { [id: string]: number }
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

    table = BDB.activities
    error: Error | null = null

    created() {
        this.filter = () => {
            return BDB.activities.orderBy('createdTime').reverse()
                .filter((item: entities.Activity<'tx' | 'cert'>): boolean => {
                    return item.data.signer.toLowerCase() === this.address!.toLowerCase()
                }).toArray()
        }
    }

    reveal(url: string) {
        BUS.$emit('open-tab', { href: url })
    }

    insight(id: string) {
        const href = `https://insight.vecha.in/#/txs/${id}`
        BUS.$emit('open-tab', { href })
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

    showComment(msg: string) {
        this.$dialog(ContentDialog, {
            title: 'Signed Content',
            content: msg,
            contentClass: 'cert-msg-dialog'
        })
    }

    resend(id: number) {
        const temp = this.rows.find((row) => {
            return row.id === id
        }) as entities.Activity<'tx'>

        remote.app.EXTENSION.txer.enqueue(temp.data.id, temp.data.raw, NODE_CONFIG.url)
        this.$store.commit('updateTxResendTime', { id: temp.data.id, value: Date.now() / 1000 })
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

    getLinkUrl(item: entities.Activity<'tx' | 'cert'>) {
        let href: string
        if (item.data.link) {
            href = item.data.link.replace('{txid}', item.data.id)
        } else {
            href = item.referer.url
        }

        return href
    }

    getCategory(item: entities.Activity<'tx' | 'cert'>): string {
        let result: string = ''
        if (item.type === 'tx') {
            const data = item.data as entities.Activity.Tx
            if (data.message.length === 0) {
                result = 'Unknown'
            } else if (data.message.length > 1) {
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
}
</script>
