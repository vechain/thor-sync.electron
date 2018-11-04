<template>
    <v-card v-bind="$attrs" v-on="$listeners">
        <v-layout column fill-height>
            <v-card-text>
                <WalletSeeker :wallets="wallets" v-model="selectedWallet" :disabled="signing"/>
            </v-card-text>
            <v-layout column class="px-4">
                <v-layout align-center style="flex:0 0 auto">
                    <span class="caption grey--text">Total value</span>
                    <v-spacer/>
                    <Amount prepend="-" sym=" VET  ">{{value.toString(10)}}</Amount>
                </v-layout>
                <v-layout align-center style="flex:0 0 auto">
                    <span class="caption grey--text">Estimated fee</span>
                    <v-spacer/>
                    <v-tooltip bottom :disabled="!(estimation.gas>0)">
                        <Amount prepend="-" sym=" VTHO " slot="activator">{{fee.toString(10)}}</Amount>
                        <span>Estimated gas {{estimation.gas}}</span>
                    </v-tooltip>
                </v-layout>
                <v-layout align-center style="flex:0 0 auto">
                    <span class="caption grey--text">Priority</span>
                    <v-spacer/>
                    <Priority v-model="gasPriceCoef" :readonly="signing"/>
                </v-layout>
                <v-layout column style="overflow-y:auto;">
                    <Tip
                        v-if="!!estimation.error"
                        class="ma-1"
                        type="error"
                    >Error got while estimating fee
                        <br>
                        <i>{{estimation.error}}</i>
                    </Tip>
                    <Tip v-if="insufficientEnergy" class="ma-1" type="warning">Insufficient energy</Tip>
                    <Tip
                        v-if="estimation.reverted"
                        class="ma-1"
                        type="warning"
                    >Transaction may fail/revert
                        <br>
                        <i>VM error {{estimation.vmError}}</i>
                    </Tip>
                </v-layout>
            </v-layout>
            <v-spacer/>
            <v-card-text>
                <v-text-field
                    :disabled="signing"
                    v-model="password"
                    label="Password"
                    type="password"
                    :error-messages="passwordError"
                    validate-on-blur
                    :rules="passwordRules"
                    ref="passwordElem"
                    @focus="passwordFocused"
                    @keyup.enter="sign"
                />
            </v-card-text>
            <div style="position:relative">
                <v-divider/>
                <v-progress-linear
                    v-show="signing"
                    class="ma-0"
                    style="position:absolute;left:0;bottom:0;"
                    height="2"
                    color="success"
                    indeterminate
                />
            </div>
            <v-card-actions style="flex:0 0 auto">
                <v-spacer/>
                <v-btn
                    :disabled="signing"
                    color="red darken-2"
                    flat
                    @click="returnValue(null)"
                >Decline</v-btn>
                <v-btn :disabled="!readyToSign" color="green darken-1" flat @click="sign">Sign</v-btn>
            </v-card-actions>
        </v-layout>
    </v-card>
</template>
<script lang="ts">
import { Vue, Component, Prop, Watch, Emit, Mixins } from 'vue-property-decorator'
import { Entities } from '../database'
import WalletSeeker from '../components/WalletSeeker.vue'
import Amount from '../components/Amount.vue'
import BigNumber from 'bignumber.js'
import * as _ from 'lodash'
import AccountLoader from '../mixin/account-loader'
import Tip from '../components/Tip.vue'
import Priority from '../components/Priority.vue'
import { estimateGas, buildTx, EstimateGasResult } from '../tx-utils'

namespace TxSigningPanel {
    export type InitValue = Readonly<{
        clauses: Connex.Thor.Clause[]
        wallets: Entities.Wallet[]
        selectedWallet: number
        suggestedGas: number
    }>
    export type ReturnValue = {
        txId: string
        rawTx: string
        signer: string
    }
}

@Component({
    components: {
        WalletSeeker,
        Amount,
        Tip,
        Priority
    }
})
class TxSigningPanel extends Mixins(AccountLoader) {
    @Prop(Object) initValue!: TxSigningPanel.InitValue
    @Emit('returnValue')
    returnValue(val: TxSigningPanel.ReturnValue | null) { }

    selectedWallet = 0
    gasPriceCoef = 0
    signing = false
    password = ''
    passwordError = ''
    estimating = false
    estimation = {
        gas: 0,
        reverted: false,
        vmError: '',
        baseGasPrice: new BigNumber(0),
        error: ''
    }
    // override
    get address() { return this.wallet.address! }
    get wallets() { return this.initValue.wallets }
    get clauses() { return this.initValue.clauses }
    get wallet() { return this.wallets[this.selectedWallet] }
    get fee() {
        if (this.estimation.gas > 0) {
            const bgp = this.estimation.baseGasPrice
            const gp = bgp.times(this.gasPriceCoef).idiv(255).plus(bgp)
            return gp.times(this.estimation.gas)
        }
        return new BigNumber(NaN)
    }
    get value() {
        return this.clauses.reduce((v, c) => {
            return v.plus(c.value)
        }, new BigNumber(0))
    }
    get energy() {
        return this.account ? new BigNumber(this.account.energy) : new BigNumber(NaN)
    }

    get insufficientEnergy() {
        return !this.fee.isNaN() && !this.energy.isNaN() && this.fee.gt(this.energy)
    }

    get readyToSign() {
        return !this.signing &&
            this.passwordRules.every(r => r(this.password) === true) &&
            this.estimation.gas
    }

    readonly passwordRules = [(v: string) => !!v || 'Input password here']
    @Watch('password')
    passwordChanged() {
        this.passwordError = ''
    }

    @Watch('initValue')
    init() {
        this.selectedWallet = this.initValue.selectedWallet
        this.gasPriceCoef = 0
        this.signing = false
        this.password = ''
        this.passwordError = ''
        this.estimating = false
        this.estimation = {
            gas: 0,
            reverted: false,
            vmError: '',
            error: '',
            baseGasPrice: new BigNumber(0)
        }
        this.estimateGasCache.clear()
        this.estimateGas()
    }

    @Watch('selectedWallet')
    reestimateGas() {
        this.estimation.gas = 0
        this.estimation.error = ''
        this.estimation.vmError = ''
        this.estimation.reverted = false

        if (this.estimateGasCache.get(this.address!)) {
            this.estimateGas()
        } else {
            this.debouncedEstimateGas()
        }
    }

    async estimateGas() {
        this.estimateGasSeq++
        const seq = this.estimateGasSeq
        try {
            const addr = this.address!
            let result = this.estimateGasCache.get(addr)
            if (!result) {
                this.estimating = true
                result = await estimateGas(this.clauses, this.initValue.suggestedGas, addr)
                this.estimateGasCache.set(addr, result)
            }

            if (seq === this.estimateGasSeq) {
                this.estimation.gas = result.gas
                this.estimation.baseGasPrice = result.baseGasPrice
                this.estimation.reverted = result.reverted
                this.estimation.vmError = result.vmError
                this.estimation.error = ''
            }
        } catch (err) {
            console.warn(err)
            if (seq === this.estimateGasSeq) {
                this.estimation.error = err.message
            }
        } finally {
            if (seq === this.estimateGasSeq) {
                this.estimating = false
            }
        }
    }

    get passwordInputElem() {
        return (this.$refs.passwordElem as Vue).$el.querySelector('input')!
    }

    passwordFocused() {
        this.passwordInputElem.select()
    }

    estimateGasSeq = 0
    estimateGasCache = new Map<string, EstimateGasResult>()
    debouncedEstimateGas!: () => void

    created() {
        this.debouncedEstimateGas = _.debounce(() => this.estimateGas(), 500)
        this.init()
    }


    async sign() {
        if (!this.readyToSign) {
            return
        }
        try {
            this.signing = true
            this.passwordError = ''

            const result = await buildTx(this.clauses, this.gasPriceCoef, this.estimation.gas)
                .sign(this.wallet.keystore!, this.password)

            this.returnValue({ ...result, signer: this.address! })
        } catch (err) {
            console.warn(err)
            if (err.message === 'message authentication code mismatch') {
                this.passwordError = 'Incorrect password'
                this.$nextTick(() => {
                    this.$nextTick(() => {
                        this.passwordInputElem.select()
                    })
                })
            }
        } finally {
            this.signing = false
        }
    }
}
export default TxSigningPanel
</script>
