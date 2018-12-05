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
                    <v-flex v-for="wallet in rows" :key="wallet.address" xs3 py-2>
                        <WalletCard
                            flat
                            class="outline"
                            style="border-radius:8px;width:185px;margin:auto;"
                            @click.native="onClick(wallet.address)"
                            :track="true"
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
import { Vue, Component, Mixins } from 'vue-property-decorator'
import NewWalletDialog from './NewWalletDialog.vue'
import ImportWalletDialog from './ImportWalletDialog.vue'
import { Entities } from '../database'
import TableLoader from '../mixins/table-loader'

@Component
class WalletsLoader extends TableLoader<Entities.Wallet>{
    tableName = DB.wallets.name
    filter = () => DB.wallets.toArray()
}

@Component({
    components: {
        NewWalletDialog,
        ImportWalletDialog
    }
})
export default class Wallets extends Mixins(WalletsLoader) {
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
