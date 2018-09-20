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
                <v-btn :disabled="signing" color="green darken-1" flat="flat" @click="cancel">
                    Cancel
                </v-btn>
                <v-btn :disabled="signing" color="green darken-1" flat="flat" @click="ok">
                    Ok
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>
<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'
import Deferred from '@/base/deferred'
import { TxSigning } from '@/renderer/signing'

@Component
export default class Comfirm extends Vue {
    private name: string = 'signDialog'

    private open: boolean = false
    private signing: boolean = false
    private password: string = ''

    private deferred = new Deferred<string>()

    private tx: TxSigning | null = null

    public async sign(clause: Connex.Thor.Clause[], origin: string) {
        this.open = true
        this.tx = new TxSigning(clause, origin)

        try {
            return await this.deferred
        } finally {
            this.deferred = new Deferred<string>()
        }
    }

    cancel() {
        if (this.open) {
            this.open = false
            this.deferred.reject(new Error('cancel'))
            this.deferred = new Deferred<string>()
        }
    }

    async ok() {
        if (this.open) {
            this.signing = true
            // this.tx!.estimateGas().then(r => {
            //     this.tx!.sign(this.password, {
            //         expiration: 720,
            //         gasPriceCoef: 0,
            //         gas: r.gas
            //     })
            // })

            let estimateGas = await this.tx!.estimateGas()

            this.tx!.sign(this.password, {
                expiration: 720,
                gasPriceCoef: 0,
                gas: estimateGas.gas
            })
                .then(result => {
                    this.open = false
                    this.signing = false
                    this.deferred.resolve(result)
                    this.deferred = new Deferred<string>()
                })
                .catch(err => {
                    this.open = false
                    this.signing = false
                    console.error(err)
                })
        }
    }
}
</script>
