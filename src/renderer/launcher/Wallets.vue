<template>
    <div>
        <NewWalletDialog v-model="dialog">
            <v-btn flat slot="activator">
                <v-icon>add</v-icon>
            </v-btn>
        </NewWalletDialog>
        <v-container grid-list-xl fluid>
            <v-layout row wrap>
                <v-flex xs3 v-for="wallet in wallets" :key="wallet.address" text-xs-center>
                    <WalletCard :track="true" :wallet="wallet" style="width: 220px;display:inline-block"> </WalletCard>
                </v-flex>
            </v-layout>
        </v-container>
    </div>
</template>
<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import { State } from 'vuex-class'
import VueRouter from 'vue-router'
import WalletCard from '../components/WalletCard.vue'
import Wallet from '../wallet'
import NewWalletDialog from './NewWalletDialog.vue'

@Component({
    components: {
        WalletCard,
        NewWalletDialog
    }
})
export default class Wallets extends Vue {
    @State wallets!: Wallet.Entity[]
    dialog = false
}
</script>
