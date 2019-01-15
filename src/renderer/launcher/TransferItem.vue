<template>
    <v-list-tile>
        <v-list-tile-avatar :size="40">
            <v-tooltip open-delay="600" left transition="fade-transition">
                <template slot="activator">
                    <v-icon color="red darken-1" v-if="isSender">mdi-arrow-right-thick</v-icon>
                    <v-icon color="green lighten-1" v-else>mdi-arrow-left-thick</v-icon>
                </template>
                <span>{{isSender? 'Send to' : 'Receive from'}}</span>
            </v-tooltip>
        </v-list-tile-avatar>
        <v-list-tile-content>
            <v-list-tile-title>
                <v-layout row>
                    <v-flex xs4>
                        <v-tooltip top open-delay="600" transition="fade-transition">
                            <a
                                @click="lookupAccount(targetAddress)"
                                slot="activator"
                            >{{ targetAddress | shortAddr}}</a>
                            <span>Lookup Account</span>
                        </v-tooltip>
                    </v-flex>
                    <v-flex xs4 text-xs-right pr-4>
                        {{isSender ? "-" : "+"}}
                        <Amount sym=" VET">{{item.amount}}</Amount>
                    </v-flex>
                    <v-flex
                        xs4
                        class="body-1 grey--text"
                        text-xs-right
                    >{{item.meta.blockTimestamp | dateTime}}</v-flex>
                </v-layout>
            </v-list-tile-title>
        </v-list-tile-content>
        <v-list-tile-action class="ml-3">
            <v-tooltip open-delay="600" top transition="fade-transition">
                <v-btn slot="activator" flat icon @click="lookupTx(item.meta.txID)">
                    <v-icon color="primary" style="font-size:150%">search</v-icon>
                </v-btn>
                <span>Lookup Tx Detail</span>
            </v-tooltip>
        </v-list-tile-action>
    </v-list-tile>
</template>
<script lang="ts">
import { Vue, Component, Watch, Prop, Mixins } from 'vue-property-decorator'
@Component
export default class TransferItem extends Vue {
    @Prop(Object) item!: Connex.Thor.Transfer
    @Prop(String) address!: string

    get isSender() { return this.item.sender === this.address }
    get targetAddress() { return this.isSender ? this.item.recipient : this.item.sender }

    lookupTx(txid: string) {
        BUS.$emit('open-tab', {
            href: `https://vechain.github.io/insight/#/txs/${txid}`,
            mode: 'append-active'
        })
    }

    lookupAccount(addr: string) {
        BUS.$emit('open-tab', {
            href: `https://vechain.github.io/insight/#/accounts/${addr}`,
            mode: 'append-active'
        })
    }
}
</script>
