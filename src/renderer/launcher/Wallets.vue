<template>
    <v-layout column align-center>
        <v-layout column style="max-width:1000px;width:100%">
            <div>
                <v-layout justify-center>
                    <NewWalletDialog v-model="dialog">
                        <v-btn flat small class="caption" color="primary" slot="activator">New</v-btn>
                    </NewWalletDialog>
                    <ImportWalletDialog persistent>
                        <v-btn flat small class="caption" color="primary" slot="activator">import</v-btn>
                    </ImportWalletDialog>
                </v-layout>
            </div>
            <div>
                <v-layout row wrap>
                    <v-flex v-for="wallet in wallets" :key="wallet.address" xs3 py-3>
                        <WalletCard
                            flat
                            class="outline"
                            style="border-radius:9px;width:170px;margin:auto;"
                            @click.native="onClick(wallet.address)"
                            :wallet="wallet"
                            ripple
                        ></WalletCard>
                    </v-flex>
                </v-layout>
            </div>
        </v-layout>
        <v-spacer/>
    </v-layout>
</template>
<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'
import NewWalletDialog from './NewWalletDialog.vue'
import ImportWalletDialog from './ImportWalletDialog.vue'
import { Entities } from '../database'
import { State } from 'vuex-class';

@Component({
    components: {
        NewWalletDialog,
        ImportWalletDialog
    }
})
export default class Wallets extends Vue {
    @State wallets!: Entities.Wallet[]
    dialog = false
    onClick(address: string) {
        this.$router.push({
            name: 'wallet-detail',
            params: {
                address
            }
        })
    }
}
</script>
