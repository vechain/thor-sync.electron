<template>
    <v-dialog content-class="bottom-right" persistent v-model="open" max-width="600px">
        <v-card>
            <v-layout row style="height:350px">
                <v-flex xs6>
                    <v-container text-xs-center v-if="!!selectedWallet">
                        <v-layout column>
                            <v-flex>
                                <WalletSelection offset-overflow fixed right offset-y :wallets="wallets" v-model="selectedWallet" max-height="400px">
                                    <v-btn large flat slot="activator" :disabled="signing">
                                        <AddressLabel icon :size="30" class="ml-2">{{selectedWallet.address}}</AddressLabel>
                                        <span class="px-2 subheading">{{selectedWallet.name}}</span>
                                        <v-spacer />
                                        <v-icon class="mr-2">mdi-menu-down</v-icon>
                                    </v-btn>
                                </WalletSelection>
                            </v-flex>
                            <AddressLabel abbrev class="ml-2">{{selectedWallet.address}}</AddressLabel>
                            <v-text-field v-model="password" label="Password" type="password" :error-messages="passwordError" />
                        </v-layout>
                    </v-container>
                </v-flex>
                <v-divider vertical />
                <v-flex xs6>
                    <v-container text-xs-center>
                        domain
                    </v-container>
                    <v-list>
                    </v-list>
                </v-flex>
            </v-layout>
            <v-progress-linear class="ma-0" :style="{visibility: signing?'visible': 'hidden'}" height="2" color="success" indeterminate />
            <v-divider />
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn :disabled="signing" color="green darken-1" flat="flat" @click="onAction(false)">
                    Cancel
                </v-btn>
                <v-btn :disabled="signing || !selectedWallet" color="green darken-1" flat="flat" @click="onAction(true)">
                    Ok
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>
<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import { State } from 'vuex-class'
import { TxSigning } from '../signing'
import { remote } from 'electron'
import Deferred from '@/common/deferred';
import Wallet from '../wallet'
import WalletSelection from '../components/WalletSelection.vue'
import AddressLabel from '../components/AddressLabel.vue'

interface SignTx {
    signTx(
        clientId: string[],
        clauses: Connex.Thor.Clause[],
        options?: Connex.Vendor.Options<'tx'>): Promise<Connex.Vendor.Signed<'tx'>>
}

@Component({
    components: {
        WalletSelection,
        AddressLabel
    }
})
export default class SignTxDialog extends Vue implements SignTx {
    private name: string = 'SignTxDialog'

    @State wallets!: Wallet.Entity[]

    selectedWallet: Wallet.Entity | null = null

    open = false
    password = ''
    signing = false
    passwordError = ''

    @Watch('open')
    openUpdated(val: boolean) {
        if (!val) {
            this.onAction = () => { }
            this.signing = false
            this.password = ''
            this.selectedWallet = null
            this.passwordError = ''
        }
    }
    @Watch('password')
    passwordUpdated() {
        this.passwordError = ''
    }

    created() {
        if (this.wallets.length > 0) {
            this.selectedWallet = this.wallets[0]
        }
    }

    async signTx(
        clientId: string[],
        clauses: Connex.Thor.Clause[],
        options?: Connex.Vendor.Options<'tx'>) {
        // TODO check whether clientId is current viewport
        if (this.open) {
            throw new Error('busy')
        }
        if (this.wallets.length === 0) {
            throw new Error('rejected')
        }
        TxSigning.validate(clauses)

        options = options || {}
        this.open = true
        if (options.origin) {
            const opt = options.origin.toUpperCase()
            this.selectedWallet = this.wallets.find(w => w.address.toUpperCase() === opt) || null
        } else {
            this.selectedWallet = this.wallets[0]
        }
        const tx = new TxSigning(clauses)

        const deferred = new Deferred<Connex.Vendor.Signed<'tx'>>()
        this.onAction = async confirmed => {
            try {
                if (!confirmed) {
                    throw new Error('rejected')
                }
                this.signing = true
                const estGas = await tx.estimateGas(this.selectedWallet!.address)

                const signedTx = await tx.sign(new Wallet(this.selectedWallet!), this.password, {
                    expiration: 720,
                    gasPriceCoef: 0,
                    gas: estGas.gas
                })

                deferred.resolve({
                    signer: this.selectedWallet!.address,
                    message: signedTx
                })
            } catch (err) {
                if (err.message === 'message authentication code mismatch') {
                    this.passwordError = 'Incorrect password'
                    return
                }
                deferred.reject(err)
            } finally {
                this.signing = false
            }
            this.open = false
        }
        return deferred
    }

    onAction(confirmed: boolean) { }
}
</script>
<style scoped>
div >>> .bottom-right {
  position: fixed;
  right: 0;
  bottom: 0;
}
</style>
