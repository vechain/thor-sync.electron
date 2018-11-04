<template>
    <v-expansion-panel-content v-bind="$attrs" v-on="$listeners">
        <v-layout column slot="header" class="mr-1">
            <v-layout row>
                <span>{{summary}}</span>
                <v-spacer/>
                <span
                    class="white--text px-1"
                    :class="status.color"
                    style="border-radius:2px"
                >{{status.text}}</span>
            </v-layout>
            <v-layout class="caption grey--text">
                <span>{{domain}}</span>
                <v-spacer/>
                <span>{{time}}</span>
            </v-layout>
        </v-layout>
        <v-card class="text-truncate">
            <v-card-text>
                <v-layout column>
                    <v-layout>
                        <span class="caption grey--text">Amount</span>
                        <v-spacer/>
                        <Amount sym=" VET " prepend="-">{{amount}}</Amount>
                    </v-layout>
                    <v-layout>
                        <span class="caption grey--text">Fee</span>
                        <v-spacer/>
                        <Amount sym=" VTHO" prepend="-">{{fee}}</Amount>
                    </v-layout>
                    <v-layout>
                        <span class="caption grey--text">Wallet</span>
                        <v-spacer/>
                        <span>{{walletName}}</span>
                    </v-layout>
                    <v-layout>
                        <span class="caption grey--text">Priority</span>
                        <v-spacer/>
                        <span>Low</span>
                    </v-layout>
                    <v-layout>
                        <span class="caption grey--text">TXID</span>
                        <v-spacer/>
                        <span>{{txid}}</span>
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
import * as NodeUrl from 'url'
const TimeAgo = require('javascript-time-ago')
const EN = require('javascript-time-ago/locale/en')
import AddressLabel from './AddressLabel.vue'
import Amount from './Amount.vue'
import BigNumber from 'bignumber.js'
import { State } from 'vuex-class'

TimeAgo.locale(EN)
const timeAgo = new TimeAgo('en-US')

type Status = Connex.Thor.Status

@Component({
    components: {
        AddressLabel,
        Amount
    }
})
export default class TxRecord extends Vue {
    @Prop(Object) entity !: Entities.TxRecord
    walletName = ''

    @State chainStatus!: Status

    created() {
        DB.wallets
            .get({ address: this.entity.signer.toLowerCase() })
            .then(v => {
                if (v) {
                    this.walletName = v ? v.name! : 'Unknown Wallet'
                }
            })
            .catch(err => console.warn)
    }

    get status(): {
        color: string,
        text: string,
        resend: boolean
    } {
        if (this.entity.confirmed) {
            return {
                color: 'success',
                text: 'confirmed',
                resend: false
            }
        }
        if (this.entity.receipt) {
            return {
                color: 'primary',
                text: `${this.chainStatus.head.number - this.entity.receipt.meta.blockNumber}/12`,
                resend: false
            }
        }

        if (Date.now() > this.entity.insertTime + 2 * 3600 * 1000) {
            return {
                color: 'error',
                text: 'dropped',
                resend: false
            }
        }

        const qStatus = connex.txQueue.status(this.entity.id)
        if (!qStatus) {
            return {
                color: 'error',
                text: 'hungup',
                resend: true
            }
        }
        if (qStatus === 'error') {
            return {
                color: 'error',
                text: 'error',
                resend: true
            }
        }

        if (qStatus === 'sent' && Date.now() > this.entity.insertTime + 10 * 60 * 1000) {
            return {
                color: 'error',
                text: 'timeout',
                resend: true
            }
        }

        return {
            color: 'orange',
            text: 'sending',
            resend: false
        }
    }

    get txObject() {
        return Transaction.decode(Buffer.from(this.entity.raw.slice(2), 'hex'))
    }

    get clauses() {
        return this.txObject.body.clauses
    }

    get summary() {
        const text = this.entity.summary[0] || this.entity.referer.title || ''
        if (text) {
            return text
        }
        if (this.clauses.length === 0) {
            return 'Empty'
        }

        if (this.clauses.length === 1) {
            if (this.clauses[0].data === '0x') {
                return 'Transfer'
            } else {
                return 'Contract call'
            }
        } else {
            return 'Complex'
        }
    }

    get domain() {
        return NodeUrl.parse(this.entity.referer.url).host
    }

    get time() {
        return timeAgo.format(this.entity.insertTime)
    }
    get txid() {
        return this.entity.id.slice(0, 16) + '…'
    }

    get amount() {
        return '0x' + this.clauses.reduce((sum, c) => {
            return sum.plus(c.value)
        }, new BigNumber(0)).toString(16)
    }

    get fee() {
        return '0x0'
    }

}
</script>
