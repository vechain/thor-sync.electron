<template>
    <v-container grid-list-xl>
        <NewWalletDialog v-model="dialog">
            <v-btn flat slot="activator">
                <v-icon>add</v-icon>
            </v-btn>
        </NewWalletDialog>
        <v-layout row wrap>
            <v-flex wrap xs4 v-for="wallet in wallets" :key="wallet.address">
                <v-hover :close-delay="0">
                    <WalletCard slot-scope="{ hover }" :class="`elevation-${hover ? 8 : 2}`" :track="true" :wallet="wallet" flat tile> </WalletCard>
                </v-hover>
            </v-flex>
        </v-layout>
    </v-container>
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
