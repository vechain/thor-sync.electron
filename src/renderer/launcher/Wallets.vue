<template>
    <v-layout column align-center>
        <v-layout column style="max-width:1000px;width:100%">
            <div>
                <v-layout justify-center py-3>
                    <a class="top-link" @click="onCreate">Create</a>
                    <a class="top-link" @click="onImport">Import</a>
                    <a class="top-link" @click="onTransfer">Transfer</a>
                </v-layout>
            </div>
            <div>
                <v-layout v-if="wallets.length>0" row wrap :justify-center="wallets.length<4">
                    <v-flex v-for="wallet in wallets" :key="wallet.address" xs3 class="py-3">
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
                <div v-else-if="storeReady" class="text-xs-center py-5">
                    <div class="headline grey--text font-weight-light">You have no wallet yet</div>
                </div>
            </div>
        </v-layout>
    </v-layout>
</template>
<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'
import { ImportWalletDialog, CreateWalletDialog } from '@/renderer/components'

@Component
export default class Wallets extends Vue {
    get wallets() { return this.$store.state.wallets as entities.Wallet[] }
    get storeReady() { return this.$store.state.ready }

    onClick(address: string) {
        this.$router.push({
            name: 'wallet-detail',
            params: {
                address
            }
        })
    }

    onImport() {
        this.$dialog(ImportWalletDialog, null)
    }

    onCreate() {
        this.$dialog(CreateWalletDialog, undefined)
    }
    onTransfer() {
        this.$router.push({ name: 'transfer' })
    }
}
</script>
