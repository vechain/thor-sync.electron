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
                <v-layout align-center mb-2>
                    <AddressLabel icon style="width:27px;height:18px;border-radius:3px">{{signer}}</AddressLabel>
                    <a
                        v-if="wallet"
                        class="px-2 subheading text-truncate"
                        @click="openWallet"
                    >{{wallet.name}}</a>
                    <span v-else>Unknown</span>
                </v-layout>
                <div v-show="!!hostname">
                    <a class="caption text-truncate" @click="reveal">
                        <v-icon style="font-size:100%;color:currentColor">mdi-link-variant</v-icon>
                        {{hostname}}
                    </a>
                </div>
            </v-card-text>
        </v-card>
    </v-expansion-panel-content>
</template>
<script lang="ts">
import { Vue, Component, Prop, Emit, Mixins } from 'vue-property-decorator'
import ActivityItemMixin from './mixins/ActivityItem.vue'
import * as TimeAgo from 'timeago.js'
import * as UrlUtils from '@/common/url-utils'
const timeAgo = TimeAgo.format

@Component
export default class CertActivityItem extends Mixins(ActivityItemMixin) {
    @Prop(Object) item !: entities.Activity<'cert'>

    @Emit('action')
    emitAction() { }

    get purpose() { return this.item.data.message.purpose }
    get time() {
        this.$store.state.syncStatus // pulse
        return timeAgo(this.item.createdTime)
    }
    get hostname() { return UrlUtils.hostnameOf(this.item.referer.url) }
    get signer() { return this.item.data.signer }

    reveal() {
        let href: string
        if (this.item.data.link) {
            href = this.item.data.link.replace('{certid}', this.item.data.id)
        } else {
            href = this.item.referer.url
        }
        BUS.$emit('open-tab', { href })
        this.emitAction()
    }
}
</script>
