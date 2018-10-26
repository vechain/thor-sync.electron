<template>
    <div style="height:100%">
        <NewWalletDialog v-model="dialog">
            <v-btn flat slot="activator">
                <v-icon>add</v-icon>
            </v-btn>
        </NewWalletDialog>
        <v-layout row wrap="">
            <v-flex
                v-for="wallet in wallets"
                :key="wallet.address"
                xs12
                sm6
                md4
                lg3
                xl2
                d-flex
                align-center
                style="flex-direction: column;transition: 0.3s"
            >
                <WalletCard
                    class="ma-4 elevation-6"
                    style="border-radius:8px"
                    @click.native="onClick(wallet.address)"
                    :track="true"
                    :wallet="wallet"
                ></WalletCard>
            </v-flex>
        </v-layout>
    </div>
</template>
<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import { State } from 'vuex-class'
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
    onClick(address: string) {
        this.$router.push({
            name: 'walletDetail',
            params: {
                address
            }
        })
    }

}
</script>
