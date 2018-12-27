<template>
    <v-expansion-panel-content v-bind="$attrs" v-on="$listeners" expand-icon>
        <v-layout row slot="header" align-center>
            <v-layout column>
                <div class="text-truncate text-capitalize">{{purpose}}</div>
                <v-layout row align-center>
                    <b class="label secondary mr-1">CERT</b>
                    <v-spacer/>
                    <span class="caption grey--text">{{time}}</span>
                </v-layout>
            </v-layout>
            <v-icon
                small
                color="success"
                style="margin-left:14px;margin-right:-2px"
            >mdi-check-circle-outline</v-icon>
        </v-layout>
        <v-card class="text-truncate">
            <v-card-text class="pt-1">
                <div v-show="!!hostname">
                    <v-icon small class="caption grey--text">mdi-web</v-icon>
                    <span class="text-truncate caption grey--text">{{hostname}}</span>
                </div>
                <v-layout align-center mb-2>
                    <AddressLabel icon style="width:27px;height:18px;border-radius:3px">{{signer}}</AddressLabel>
                    <span class="px-2 subheading">{{walletName}}</span>
                </v-layout>
            </v-card-text>
        </v-card>
    </v-expansion-panel-content>
</template>
<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
import TimeAgo from 'timeago.js'
import * as UrlUtils from '@/common/url-utils'
const timeAgo = TimeAgo()

@Component
export default class CertActivityItem extends Vue {
    @Prop(Object) item !: entities.Activity<'cert'>

    get purpose() { return this.item.data.message.purpose }
    get time() {
        this.$store.state.syncStatus // pulse
        return timeAgo.format(this.item.createdTime)
    }
    get hostname() { return UrlUtils.hostnameOf(this.item.referer.url) }
    get signer() { return this.item.data.signer }
    get walletName() {
        const wallets = this.$store.state.wallets as entities.Wallet[]
        const wallet = wallets.find(w => w.address === this.signer)
        return wallet ? wallet.name : 'Unknown'
    }
}
</script>
