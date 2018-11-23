<template>
    <div style="height:100%">
        <NewWalletDialog v-model="dialog">
            <v-btn flat icon slot="activator">
                <v-icon>add</v-icon>
            </v-btn>
        </NewWalletDialog>
        <ImportWalletDialog persistent>
            <v-btn flat icon slot="activator">
                <v-icon>edit</v-icon>
            </v-btn>
        </ImportWalletDialog>
        <v-layout row wrap="">
            <v-flex
                v-for="wallet in rows"
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
                    hover
                    class="ma-4 outline"
                    style="border-radius:8px;width:220px"
                    @click.native="onClick(wallet.address)"
                    :track="true"
                    :wallet="wallet"
                ></WalletCard>
            </v-flex>
        </v-layout>
    </div>
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
