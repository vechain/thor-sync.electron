<template>
    <v-expansion-panel-content v-bind="$attrs" v-on="$listeners" expand-icon>
        <v-layout row slot="header" align-center>
            <v-layout column>
                <div class="text-truncate" :title="comment">{{comment}}</div>
                <v-layout row align-center>
                    <b class="label primary mr-1">TX</b>
                    <b v-show="reverted" class="label warning">Reverted</b>
                    <v-spacer />
                    <span class="caption grey--text">{{time}}</span>
                </v-layout>
            </v-layout>
            <Tooltip top>
                <v-btn
                    slot="activator"
                    icon
                    small
                    flat
                    @click.stop="resend"
                    class="my-0"
                    style="margin-right:-8px;"
                    :style="{'pointer-events': canResend? '':'none'}"
                >
                    <v-icon small :color="iconColor">{{icon}}</v-icon>
                </v-btn>
                <span>{{statusDesc}}</span>
            </Tooltip>
        </v-layout>
        <v-card class="text-truncate">
            <v-card-text class="pt-1">
                <v-layout align-center mb-2>
                    <AddressLabel icon style="width:27px;height:18px;border-radius:3px">{{signer}}</AddressLabel>
                    <a
                        v-if="wallet"
                        class="px-2 subheading text-truncate"
                        @click="openWallet"
                    >{{wallet.name}}</a>
                    <span v-else>Unknown</span>
                </v-layout>
                <v-layout>
                    <span class="caption grey--text">Amount</span>
                    <v-spacer />
                    <Amount sym=" VET " prepend="-">{{amount}}</Amount>
                </v-layout>
                <v-layout>
                    <span class="caption grey--text">{{fee ? 'Fee':'Est. fee'}}</span>
                    <v-spacer />
                    <Amount sym=" VTHO" prepend="-">{{fee || estimatedFee}}</Amount>
                </v-layout>

                <v-layout>
                    <span class="caption grey--text">Priority</span>
                    <v-spacer />
                    <Priority :readonly="true" :priority="gasPriceCoef" />
                </v-layout>
                <v-layout class="my-1">
                    <a class="caption" v-explore.tx="txid" @click="emitAction">
                        <v-icon style="font-size:110%;color:currentColor">search</v-icon>
                        {{txid | shortTxId}}
                    </a>
                </v-layout>
                <v-layout v-show="!!hostname" class="my-1">
                    <a class="caption text-truncate" @click="reveal">
                        <v-icon style="font-size:100%;color:currentColor">mdi-link-variant</v-icon>
                        {{hostname}}
                    </a>
                </v-layout>
            </v-card-text>
        </v-card>
    </v-expansion-panel-content>
</template>
<script lang="ts">
import  { Vue, Component, Prop, Emit, Mixins } from 'vue-property-decorator'
import ActivityItemMixin from './mixins/ActivityItem.vue'
import { State } from 'vuex-class'
import { describeClauses } from '@/common/formatter'
import * as UrlUtils from '@/common/url-utils'
import { Transaction } from 'thor-devkit'
import BigNumber from 'bignumber.js'
import { remote } from 'electron'
import Activities from './ActivitiesLoader.vue'

@Component
export default class TxActivityItem extends Mixins(ActivityItemMixin) {
    @Prop(Object) item !: entities.Activity<'tx'>

    @State
    txResendTime!: { [id: string]: number }

    get txObject() { return Transaction.decode(Buffer.from(this.item.data.raw.slice(2), 'hex')) }
    get comment() { return this.item.data.comment || describeClauses(this.item.data.message) }
    get hostname() { return UrlUtils.hostnameOf(this.item.referer.url) }
    get reverted() { return this.item.data.receipt ? this.item.data.receipt.reverted : false }
    get time() {
        this.$store.state.syncStatus // pulse
        return this.timeAgo(this.item.createdTime)
    }
    get txid() { return this.item.data.id }
    get signer() { return this.item.data.signer }
    get gasPriceCoef() { return this.txObject.body.gasPriceCoef }
    get estimatedFee() { return this.item.data.estimatedFee }
    get fee() { return this.item.data.receipt ? this.item.data.receipt.paid : '' }
    get amount() {
        return '0x' + this.item.data.message.reduce((sum, c) => {
            return sum.plus(c.value)
        }, new BigNumber(0)).toString(16)
    }

    get status() {
        this.$store.state.syncStatus // pulse
        const headTs = this.$store.state.chainHead.timestamp as number
        if (this.item.data.receipt) {
            return this.item.closed ? 'confirmed' : 'confirming'
        } else if (this.item.closed) {
            return 'dropped'
        }

        const qStatus = remote.app.EXTENSION.txer.status(this.item.data.id)
        if (!qStatus) {
            return 'hanging'
        }
        if (qStatus === 'error') {
            return 'error'
        }

        const sendTime = this.txResendTime[this.item.data.id] || this.item.data.timestamp
        if (qStatus === 'sent' && headTs > sendTime + 10 * 6) {
            return 'timeout'
        }

        return 'sending'
    }

    get statusDesc() {
        switch (this.status) {
            case 'confirmed': return 'Confirmed'
            case 'confirming': return 'Confirming...'
            case 'sending': return 'Sending...'
            case 'dropped': return 'Dropped'
            default: return 'Click to retry'
        }
    }

    get icon() {
        switch (this.status) {
            case 'confirmed': return 'mdi-check-circle-outline'
            case 'confirming': return 'mdi-progress-check'
            case 'sending': return 'mdi-progress-upload'
            case 'dropped': return 'mdi-alert-circle-outline'
            default: return 'mdi-restart'
        }
    }
    get iconColor() {
        switch (this.status) {
            case 'confirmed': return 'success'
            case 'confirming': return 'info'
            case 'sending': return 'info'
            default: return 'error'
        }
    }
    get canResend() {
        return this.icon === 'mdi-restart'
    }

    @Emit('action')
    emitAction() { }

    resend() {
        remote.app.EXTENSION.txer.enqueue(this.item.data.id, this.item.data.raw, NODE_CONFIG.url)
        this.$store.commit('updateTxResendTime', { id: this.item.data.id, value: Date.now() / 1000 })
    }

    reveal() {
        let href: string
        if (this.item.data.link) {
            href = this.item.data.link.replace('{txid}', this.txid)
        } else {
            href = this.item.referer.url
        }
        BUS.$emit('open-tab', { href })
        this.emitAction()
    }
}
</script>
