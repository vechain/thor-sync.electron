<template>
    <v-card
        v-bind="$attrs"
        v-on="$listeners"
        :style="{'font-size': compact? '90%':'inherit'}"
        style="cursor:default;"
    >
        <IdentBox :text="wallet.address.toLowerCase()">
            <v-card-text class="white--text" :class="compact?'py-1':'py-2'">
                <v-layout column fill-height justify-center>
                    <span
                        class="text-truncate"
                        :class="compact?'body-2':'subheading'"
                    >{{wallet.name}}</span>
                    <AddressLabel abbrev class="text-truncate caption">{{wallet.address}}</AddressLabel>
                </v-layout>
            </v-card-text>
        </IdentBox>
        <v-card-text class="py-1">
            <v-layout column align-end :style="{'line-height': compact ? '120%':'inherit'}">
                <Amount sym=" VET ">{{balance}}</Amount>
                <Amount sym=" VTHO">{{energy}}</Amount>
            </v-layout>
        </v-card-text>
    </v-card>
</template>
<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import { Entities } from '../database'

@Component
export default class WalletCard extends Vue {
    @Prop(Object) wallet!: Entities.Wallet
    @Prop(Boolean) compact!: boolean

    account: Connex.Thor.Account | null = null

    get balance() {
        return this.account && this.account.balance
    }

    get energy() {
        return this.account && this.account.energy
    }

    @Watch('wallet')
    @Watch('$store.state.chainHead')
    async loadAccount() {
        const addr = this.wallet.address!
        const account = await connex.thor.account(addr).get()
        if (addr === this.wallet.address) {
            this.account = account

        }
    }

    created() {
        this.loadAccount()
    }

}
</script>

