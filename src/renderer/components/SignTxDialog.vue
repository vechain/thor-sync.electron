<template>
    <v-dialog persistent v-model="open" max-width="500px">
        <v-card>
            <v-card-title>
                <span class="headline">
                    Sign
                </span>
            </v-card-title>
            <v-form>
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
                <v-btn :disabled="signing" color="green darken-1" flat="flat" @click="onFinish(false)">
                    Cancel
                </v-btn>
                <v-btn :disabled="signing" color="green darken-1" flat="flat" @click="onFinish(true)">
                    Ok
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>
<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import { TxSigning } from '@/renderer/signing'

@Component
export default class SignTxDialog extends Vue {
    private name: string = 'SignTxDialog'

    @Prop(Object) data!: SignTxDialog.Data | null
    open = false
    password = ''
    signing = false

    @Watch('data')
    onDataChanged(data: SignTxDialog.Data | null) {
        if (!data) {
            return
        }
        if (this.open) {
            return data.callback(new Error('in progress'))
        }
        try {
            const tx = new TxSigning(data.clauses, data.origin)
            this.open = true
            this.onFinish = async confirmed => {
                try {
                    if (!confirmed) {
                        return data.callback(new Error('cancelled'))
                    }

                    this.signing = true
                    const estGas = await tx.estimateGas()
                    const signedTx = await tx.sign(this.password, {
                        expiration: 720,
                        gasPriceCoef: 0,
                        gas: estGas.gas
                    })
                    data.callback(undefined, signedTx)
                } catch (err) {
                    data.callback(err)
                } finally {
                    this.open = false
                    this.signing = false
                    this.password = ''
                }
            }
        } catch (err) {
            data.callback(err)
        }
    }

    onFinish(confirmed: boolean) { }
}
</script>
