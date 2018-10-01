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
                    <account-card slot-scope="{ hover }" :class="`elevation-${hover ? 8 : 2}`" :track="true" :name="wallet.name" :address="wallet.address" flat tile> </account-card>
                </v-hover>
            </v-flex>
        </v-layout>
    </v-container>
</template>
<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import { State } from 'vuex-class'
import VueRouter from 'vue-router'
import AccountCard from '../components/AccountCard.vue'
import Wallet from '../wallet'
import NewWalletDialog from './NewWalletDialog.vue'

@Component({
    components: {
        AccountCard,
        NewWalletDialog
    }
})
export default class Wallets extends Vue {
    @State wallets!: Wallet.Entity[]
    dialog = false
}
</script>
