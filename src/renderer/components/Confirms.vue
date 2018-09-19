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

    public async sign(
        contentId: number,
        clause: Connex.Thor.Clause[],
        origin: string
    ) {
        this.tx = new TxSigning(
            [],
            '0xf6e78a5584c06e2dec5c675d357f050a5402a730'
        )
        // let estimateGas = await this.tx.estimateGas()
        // // if (estimateGas.reverted) {
        // // }
        // let password = ''

        // this.tx.sign(password, {
        //     expiration: 720,
        //     gasPriceCoef: 0,
        //     gas: estimateGas.gas
        // })
        this.open = true
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
                .catch((err) => {
                    console.error(err)
                    this.open = false
                    this.signing = false
                })
        }
    }
}
</script>
