<template>
    <v-expansion-panel-content v-bind="$attrs" v-on="$listeners" expand-icon>
        <v-layout row slot="header" align-center>
            <v-layout column>
                <i class="text-truncate">{{summary}}</i>
                <v-layout align-center>
                    <v-icon small class="caption grey--text">mdi-web</v-icon>
                    <span v-show="!!host" class="text-truncate caption grey--text">{{host}}</span>
                    <v-spacer/>
                    <b v-show="reverted" class="error label text-uppercase">reverted !</b>
                </v-layout>
            </v-layout>
            <v-btn
                icon
                small
                flat
                @click.stop="onResend"
                class="my-0"
                style="margin-right:-8px;"
                :style="{'pointer-events': resend? '':'none'}"
            >
                <v-icon small :color="iconColor">{{icon}}</v-icon>
            </v-btn>
        </v-layout>
        <v-card class="text-truncate">
            <v-card-text class="pt-1">
                <v-layout column>
                    <v-layout>
                        <v-spacer/>
                        <span class="caption grey--text">{{time}}</span>
                    </v-layout>
                    <v-layout align-center mb-2>
                        <IdentBox :text="signer" style="width:18px;height:18px;border-radius:2px"/>
                        <span class="px-2 subheading">{{walletName}}</span>
                    </v-layout>
                    <v-layout>
                        <span class="caption grey--text">Amount</span>
                        <v-spacer/>
                        <Amount sym=" VET " prepend="-">{{amount}}</Amount>
                    </v-layout>
                    <v-layout>
                        <span class="caption grey--text">{{fee ? 'Fee':'Est. fee'}}</span>
                        <v-spacer/>
                        <Amount sym=" VTHO" prepend="-">{{fee || estimatedFee}}</Amount>
                    </v-layout>
                    <v-layout>
                        <span class="caption grey--text">Priority</span>
                        <v-spacer/>
                        <Priority :readonly="true" :priority="gasPriceCoef"/>
                    </v-layout>
                    <v-layout align-center>
                        <span class="caption grey--text">TXID</span>
                        <v-spacer/>
                        <v-btn
                            primary
                            small
                            color="primary"
                            flat
                            icon
                            class="ma-0"
                            @click="onReveal"
                        >
                            <v-icon small style="font-size:120%">mdi-link-variant</v-icon>
                        </v-btn>
                        <v-btn
                            primary
                            v-clipboard="txid"
                            small
                            color="primary"
                            flat
                            icon
                            class="ma-0 mr-1"
                        >
                            <v-icon small style="font-size:100%">mdi-content-copy</v-icon>
                        </v-btn>
                        <span>{{txid | shortTxId}}</span>
                    </v-layout>
                </v-layout>
            </v-card-text>
        </v-card>
    </v-expansion-panel-content>
</template>
<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
import { Entities } from '../database'
import { Transaction } from 'thor-devkit'
import * as UrlUtils from '@/common/url-utils'
import BigNumber from 'bignumber.js'
import { State } from 'vuex-class'
import { describe } from '@/renderer/vendor/utils'
import TimeAgo from 'timeago.js'

type Status = Connex.Thor.Status
const timeAgo = TimeAgo()

@Component
export default class TxRecord extends Vue {
    @Prop(Object) entity !: Entities.TxRecord
    wallet: Entities.Wallet | null = null
    timestamp = 0

    @State chainStatus!: Status

    get signer() { return this.entity.signer.toLowerCase() }
    get walletName() { return this.wallet ? this.wallet.name : 'Unknown' }

    get txObject() { return Transaction.decode(Buffer.from(this.entity.raw.slice(2), 'hex')) }
    get clauses() { return this.txObject.body.clauses }
    get summary() { return this.entity.summary[0] || describe(this.clauses) }
    get host() { return UrlUtils.hostOf(this.entity.referer.url) }
    get time() { return timeAgo.format(this.entity.insertTime) }
    get txid() { return this.entity.id }
    get gasPriceCoef() { return this.txObject.body.gasPriceCoef }
    get amount() {
        return '0x' + this.clauses.reduce((sum, c) => {
            return sum.plus(c.value)
        }, new BigNumber(0)).toString(16)
    }
    get reverted() { return this.entity.receipt ? this.entity.receipt.reverted : false }
    get estimatedFee() { return this.entity.estimatedFee }
    get fee() { return this.entity.receipt ? this.entity.receipt.paid : '' }

    get status() {
        // reference to update timely
        this.timestamp
        if (this.entity.confirmed) {
            return 'confirmed'
        }
        if (this.entity.receipt) {
            return 'confirming'
        }

        if (Date.now() > this.entity.insertTime + 2 * 3600 * 1000) {
            return 'dropped'
        }

        const qStatus = TXER.status(this.entity.id)
        if (!qStatus) {
            return 'hanging'
        }
        if (qStatus === 'error') {
            return 'error'
        }

        if (qStatus === 'sent' && Date.now() > this.entity.insertTime + 10 * 60 * 1000) {
            return 'timeout'
        }

        return 'sending'
    }

    get resend() {
        return this.status === 'error' ||
            this.status === 'hanging' ||
            this.status === 'timeout'
    }

    get icon() {
        switch (this.status) {
            case 'confirmed': return 'mdi-check-circle-outline'
            case 'confirming': return 'mdi-progress-check'
            case 'sending': return 'mdi-progress-upload'
            case 'dropped': return 'mdi-alert-circle-outline'
            default:
                return 'mdi-restart'
        }
    }
    get iconColor() {
        switch (this.status) {
            case 'confirmed':
                return 'success'
            case 'confirming':
            case 'sending':
                return 'warning'
            default:
                return 'error'
        }
    }


    timer !: any
    async created() {
        this.wallet = (await DB.wallets
            .get({ address: this.entity.signer.toLowerCase() })) || null
        this.timer = setInterval(() => this.timestamp = Date.now(), 2000)
    }

    destroyed() {
        clearInterval(this.timer)
    }

    onResend() {
        TXER.send(this.entity.id, this.entity.raw)
    }
    onReveal() {
        const href = this.entity.link || this.entity.referer.url
        const url = new URL(href)
        url.searchParams.append('txid', this.txid)
        BUS.$emit('open-tab', { href: url.href })
    }
}
</script>
