<template>
    <v-dialog persistent v-model="open" max-width="500px">
        <v-card>
            <v-card-title>
                <span class="headline">
                    Sign
                </span>
            </v-card-title>
            <v-form>
                <AccountSwitch v-model="origin" />
                <v-container fluid>
                    <v-layout row justify-center>
                        <v-flex sm8>
                            <v-text-field solo v-model="password" type="password">
                            </v-text-field>
                        </v-flex>
                    </v-layout>
                </v-container>
            </v-form>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn :disabled="signing" color="green darken-1" flat="flat" @click="onAction(false)">
                    Cancel
                </v-btn>
                <v-btn :disabled="signing" color="green darken-1" flat="flat" @click="onAction(true)">
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
import AccountSwitch from '../components/AccountSwitch.vue'
import Wallet from '../wallet'
import serializeError from 'serialize-error'
@Component({
    components: {
        AccountSwitch
    }
})
export default class SignTxDialog extends Vue {
    private name: string = 'SignTxDialog'

    @State wallets!: Wallet.Entity[]

    open = false
    password = ''
    signing = false
    origin = ""

    created() {
        remote.app.EXTENSION.inject(
            ENV.contents!.id,
            `uix.${ENV.xargs!.clientId![0]}`, {
                signTx: (
                    clientId: string[],
                    clauses: Connex.Thor.Clause[],
                    options: Connex.Vendor.Options<'tx'> | undefined,
                    callback: (err?: Error, result?: Connex.Vendor.Signed<'tx'>) => void
                ) => {
                    this.signTx(clientId, clauses, options)
                        .then(r => callback(undefined, r))
                        .catch(err => callback(serializeError(err)))
                }
            })
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
            throw new Error('no wallet')
        }
        TxSigning.validate(clauses)

        options = options || {}
        this.open = true
        this.origin = options.origin || this.wallets[0].address
        const tx = new TxSigning(clauses)

        const deferred = new Deferred<Connex.Vendor.Signed<'tx'>>()
        this.onAction = async confirmed => {
            try {
                if (!confirmed) {
                    throw new Error('user rejected')
                }
                this.signing = true
                const estGas = await tx.estimateGas(this.origin)

                const entity = this.wallets.find(w => w.address === this.origin)
                if (!entity) {
                    throw new Error('wallet lost')
                }

                const signedTx = await tx.sign(new Wallet(entity), this.password, {
                    expiration: 720,
                    gasPriceCoef: 0,
                    gas: estGas.gas
                })

                deferred.resolve({
                    signer: entity.address,
                    message: signedTx
                })
            } catch (err) {
                deferred.reject(err)
            } finally {
                this.open = false
                this.onAction = () => { }
                this.signing = false
                this.password = ''
                this.origin = ''
            }
        }
        return deferred
    }

    onAction(confirmed: boolean) { }
}
</script>
