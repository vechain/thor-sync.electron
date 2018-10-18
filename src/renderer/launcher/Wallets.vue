<template>
    <div style="height:100%">
        <NewWalletDialog v-model="dialog">
            <v-btn flat slot="activator">
                <v-icon>add</v-icon>
            </v-btn>
        </NewWalletDialog>
        <v-container  grid-list-lg>
            <v-layout row wrap>
                <v-flex xs3 v-for="wallet in wallets" :key="wallet.address">
                    <WalletCard :track="true" :wallet="wallet" style="max-width: 220px;"> </WalletCard>
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
import NewWalletDialog from './NewWalletDialog.vue'
import { Entities } from '../database'

@Component({
    components: {
        WalletCard,
        NewWalletDialog
    }
})
export default class Wallets extends Vue {
    dialog = false
    wallets: Entities.Wallet[] = []

    @State walletsRevision!: number
    @Watch('walletsRevision')
    async reloadWallets() {
        this.wallets = await DB.wallets.toArray()
    }
    created() {
        this.reloadWallets()
    }


}
</script>
