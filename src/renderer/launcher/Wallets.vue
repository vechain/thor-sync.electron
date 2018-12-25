<template>
    <v-layout column align-center>
        <v-layout column style="max-width:1000px;width:100%">
            <div>
                <v-layout justify-center>
                    <v-btn flat small class="caption" color="primary" @click="onCreate">New</v-btn>
                    <v-btn flat small class="caption" color="primary" @click="onImport">Import</v-btn>
                    <router-link tag="span" to="/transfer">
                        <v-btn flat small class="caption" color="primary">Transfer</v-btn>
                    </router-link>
                </v-layout>
            </div>
            <div>
                <v-layout row wrap :justify-center="wallets.length<4">
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
            </div>
        </v-layout>
        <v-spacer/>
    </v-layout>
</template>
<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'
import { ImportWalletDialog, CreateWalletDialog } from '@/renderer/components'
import { Entities } from '../database'
import { State } from 'vuex-class'

@Component
export default class Wallets extends Vue {
    @State
    wallets!: Entities.Wallet[]

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
}
</script>
