<template>
    <v-card v-if="listitem===undefined" v-bind="$attrs">
        <v-list class="pt-3">
            <v-list-tile>
                <v-list-tile-avatar v-if="noicon===undefined">
                    <IdentIcon :address="address" style="border-radius:10px;"></IdentIcon>
                </v-list-tile-avatar>
                <v-list-tile-content>
                    <v-list-tile-title>{{name}}</v-list-tile-title>
                    <v-list-tile-sub-title>
                        <span style="font-family: 'Roboto Mono'">{{abbrevAddress}}</span>
                    </v-list-tile-sub-title>
                </v-list-tile-content>
            </v-list-tile>
        </v-list>
        <v-card-text class="pt-0" style="text-align: right">
            <div>
                <span class="token-value">{{balance[0]}}</span><span class="token-value caption">{{balance[1]}}</span>
                <span class="token-symbol">VET</span>
            </div>
            <div>
                <span class="token-value">{{energy[0]}}</span><span class="token-value caption">{{energy[1]}}</span>
                <span class="token-symbol">VTHO</span>
            </div>
        </v-card-text>
    </v-card>
    <v-list-tile v-else v-on="$listeners" v-bind="$attrs">
        <v-list-tile-avatar v-if="noicon===undefined">
            <IdentIcon :size="30" :address="address" style="border-radius:5px;"></IdentIcon>
        </v-list-tile-avatar>
        <v-list-tile-content>
            <v-list-tile-title>
                {{name}}
            </v-list-tile-title>
            <v-list-tile-sub-title>
                <div style="text-align: right; line-height:90%">
                    <span class="token-value">{{balance[0]}}</span><span class="token-value caption">{{balance[1]}}</span>
                    <span class="token-symbol">VET</span>
                </div>
                <div style="text-align: right; line-height:90%">
                    <span class="token-value">{{energy[0]}}</span><span class="token-value caption">{{energy[1]}}</span>
                    <span class="token-symbol">VTHO</span>
                </div>
            </v-list-tile-sub-title>
        </v-list-tile-content>
    </v-list-tile>
</template>
<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
import Store from '../store'
import IdentIcon from './IdentIcon.vue'
import { Num, Address } from '@/common/formatter'
import { cry } from 'thor-devkit'

@Component({
    components: {
        IdentIcon
    }
})
export default class AccountCard extends Vue {
    @Prop(String) name!: string
    @Prop({ validator: cry.isAddress }) address!: string
    @Prop(Boolean) track!: boolean
    @Prop({ default: undefined }) listitem!: any
    @Prop({ default: undefined }) noicon: any

    untrack = () => { }

    destroyed() {
        this.untrack()
    }

    get account() {
        // untrack previously tracked
        this.untrack()

        const tracker = this.$store.getters.account(this.address)
        if (this.track) {
            // settle untrack method
            this.untrack = () => {
                tracker.untrack()
                this.untrack = () => { }
            }
        } else {
            // untrack immediately if `track` set to false
            tracker.untrack()
        }
        return tracker.account as Store.Account
    }

    get checksumAddress() {
        return Address.toChecksum(this.address)
    }

    get abbrevAddress() {
        return Address.abbrev(this.address!)
    }

    sep(numStr: string | null) {
        if (!numStr) {
            return ['--', '.--']
        }
        numStr = Num.formatBalance(numStr, 2)
        const dp = numStr.indexOf('.')
        return [numStr.slice(0, dp), numStr.slice(dp)]
    }
    get balance() {
        return this.sep(this.account.data && this.account.data.balance)
    }

    get energy() {
        return this.sep(this.account.data && this.account.data.energy)
    }
}
</script>
<style lang="less" scoped>
.token-symbol {
  text-align: left;
  font-size: 8px;
  width: 24px;
  opacity: 0.5;
  display: inline-block;
}
.token-value {
  letter-spacing: -0.5px;
  font-family: "Roboto Mono", monospace;
}
</style>
