<template>
    <v-card
        v-bind="$attrs"
        v-on="$listeners"
        class="wallet-card"
        :style="{'font-size': compact? '90%':'inherit'}"
    >
        <IdentBox :text="wallet.address.toLowerCase()">
            <v-card-text class="white--text" :class="{'py-2': compact}">
                <v-layout
                    column
                    fill-height
                    justify-center
                    style="text-shadow: 0px 1px 1px #000, 0px -0.5px 1px #fff;"
                >
                    <span
                        class="font-weight-light text-truncate"
                        :class="compact?'title':'headline'"
                    >{{wallet.name}}</span>
                    <AddressLabel abbrev class="text-truncate">{{wallet.address}}</AddressLabel>
                </v-layout>
            </v-card-text>
        </IdentBox>
        <v-card-text class="py-2" :class="{'pa-2': compact}">
            <v-layout column align-end :style="{'line-height': compact ? '120%':'inherit'}">
                <Amount sym=" VET ">{{balance}}</Amount>
                <Amount sym=" VTHO">{{energy}}</Amount>
            </v-layout>
        </v-card-text>
    </v-card>
</template>
<script lang="ts">
import { Vue, Component, Prop, Mixins } from 'vue-property-decorator'
import AddressLabel from '../components/AddressLabel.vue'
import Amount from '../components/Amount.vue'
import { Entities } from '../database'
import IdentBox from '../components/IdentBox.vue'
import AccountLoader from '../mixin/account-loader'

@Component({
    components: {
        IdentBox,
        AddressLabel,
        Amount
    }
})
export default class WalletCard extends Mixins(AccountLoader) {
    @Prop(Object) wallet!: Entities.Wallet
    @Prop(Boolean) compact!: boolean

    // override AccountLoader.address
    get address() {
        return this.wallet ? (this.wallet.address || '') : ''
    }

    get isValid() { return this.wallet && Entities.isWallet(this.wallet) }

    get balance() {
        return this.account && this.account.balance
    }

    get energy() {
        return this.account && this.account.energy
    }
}
</script>
<style scoped>
/* border for flat mode */
.v-card--flat.wallet-card::before {
  border-radius: inherit;
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  border: 1px solid rgba(0, 0, 0, 0.12);
  width: 100%;
}
</style>

