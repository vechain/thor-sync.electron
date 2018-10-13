<template>
    <v-list-tile v-if="listitem" v-bind="$attrs" v-on="$listeners">
        <template v-if="isValid">
            <v-list-tile-content>
                <v-list-tile-title>
                    <v-layout align-center>
                        <AddressLabel icon :size="20" class="mr-2">{{wallet.address}}</AddressLabel>{{wallet.name}}
                    </v-layout>
                </v-list-tile-title>
                <v-list-tile-sub-title>
                    <v-layout column style="line-height:90%" text-xs-right>
                        <v-flex>
                            <Amount sym=" VET ">{{balance}}</Amount>
                        </v-flex>
                        <v-flex>
                            <Amount sym=" VTHO">{{energy}}</Amount>
                        </v-flex>
                    </v-layout>
                </v-list-tile-sub-title>
            </v-list-tile-content>
        </template>
        <div v-else>
            Invalid wallet
        </div>
    </v-list-tile>
    <v-card v-else v-bind="$attrs" v-on="$listeners">
        <template v-if="isValid">
            <v-list class="pt-3">
                <v-list-tile>
                    <v-list-tile-avatar v-if="!noicon">
                        <AddressLabel icon>{{wallet.address}}</AddressLabel>
                    </v-list-tile-avatar>
                    <v-list-tile-content>
                        <v-list-tile-title>{{wallet.name}}</v-list-tile-title>
                        <v-list-tile-sub-title>
                            <AddressLabel abbrev>{{wallet.address}}</AddressLabel>
                        </v-list-tile-sub-title>
                    </v-list-tile-content>
                </v-list-tile>
            </v-list>
            <v-card-text class="pt-0" style="text-align: right">
                <div>
                    <Amount sym=" VET ">{{balance}}</Amount>
                </div>
                <div>
                    <Amount sym=" VTHO">{{energy}}</Amount>
                </div>
            </v-card-text>
        </template>
        <div v-else>
            Invalid wallet
        </div>
    </v-card>
</template>
<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
import Store from '../store'
import Wallet from '../wallet'
import { Num } from '@/common/formatter'
import AddressLabel from '../components/AddressLabel.vue'
import Amount from '../components/Amount.vue'


@Component({
    components: {
        AddressLabel,
        Amount
    }
})
export default class WalletCard extends Vue {
    @Prop(Object) wallet!: Wallet.Entity
    @Prop(Boolean) track!: boolean
    @Prop(Boolean) listitem!: boolean
    @Prop(Boolean) noicon!: boolean

    untrack = () => { }

    destroyed() { this.untrack() }

    get isValid() { return this.wallet && Wallet.isEntity(this.wallet) }

    get account() {
        // untrack previously tracked
        this.untrack()

        const tracker = this.$store.getters.account(this.wallet.address)
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


    get balance() {
        return this.account.data && this.account.data.balance
    }

    get energy() {
        return this.account.data && this.account.data.energy
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
