<template>
    <DialogEx
        persistent
        content-class="sign-dialog"
        v-model="opened"
        @action:ok="sign"
        @action:cancel="decline"
        transition="sign-dialog-transition"
    >
        <v-card>
            <v-layout row style="height:450px;">
                <v-layout
                    column
                    style="width:350px;flex:0 0 auto;background-color:rgba(0,0,0,0.12);overflow:auto;"
                >
                    <div class="py-2 px-3">
                        <div class="subheading text-truncate">Transaction</div>
                        <div class="text-truncate">
                            <i>{{txComment}}</i>
                        </div>
                    </div>
                    <v-expansion-panel expand popout class="pa-1" style="overflow:auto;">
                        <ClauseItem
                            tabindex="-1"
                            v-for="(clause,i) in clauses"
                            :key="i"
                            :index="i"
                            :clause="clause"
                        />
                    </v-expansion-panel>
                </v-layout>
                <v-layout column style="width:300px;">
                    <v-card-text>
                        <WalletSeeker
                            :wallets="wallets"
                            v-model="arg.selectedWallet"
                            :disabled="signing"
                        />
                        <v-layout align-center mt-2>
                            <span class="caption grey--text">Total value</span>
                            <v-spacer/>
                            <Amount prepend="-" sym=" VET  ">{{value.toString(10)}}</Amount>
                        </v-layout>
                        <v-layout align-center>
                            <span class="caption grey--text">Estimated fee</span>
                            <v-spacer/>
                            <v-tooltip bottom :disabled="!(estimation.gas>0)">
                                <Amount
                                    prepend="-"
                                    sym=" VTHO "
                                    slot="activator"
                                >{{fee.toString(10)}}</Amount>
                                <span>Estimated gas {{estimation.gas}}</span>
                            </v-tooltip>
                        </v-layout>
                        <v-layout align-center>
                            <span class="caption grey--text">Priority</span>
                            <v-spacer/>
                            <Priority v-model="gasPriceCoef" :readonly="signing"/>
                        </v-layout>
                    </v-card-text>
                    <v-layout column style="overflow-y:auto;flex:0 1 auto">
                        <Tip
                            v-if="estimation.error"
                            class="ma-1"
                            type="error"
                        >Error got while estimating fee
                            <br>
                            <i>{{estimation.error}}</i>
                        </Tip>
                        <Tip
                            v-if="insufficientEnergy"
                            class="ma-1"
                            type="warning"
                        >Insufficient energy</Tip>
                        <Tip
                            v-if="estimation.reverted"
                            class="ma-1"
                            type="warning"
                        >Transaction may fail/revert
                            <br>
                            <i>VM error {{estimation.vmError}}</i>
                        </Tip>
                    </v-layout>
                    <v-spacer/>
                    <v-card-text>
                        <v-text-field
                            v-focus
                            :disabled="signing"
                            v-model="password"
                            label="Password"
                            type="password"
                            :error-messages="passwordError"
                            validate-on-blur
                            :rules="passwordRules"
                            ref="passwordElem"
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
                    <v-card-actions style="flex: 0 0 auto;">
                        <v-spacer/>
                        <v-btn :disabled="signing" flat @click="decline">Decline</v-btn>
                        <v-btn
                            :disabled="!readyToSign"
                            color="green darken-1"
                            flat
                            @click="sign"
                        >Sign</v-btn>
                    </v-card-actions>
                </v-layout>
            </v-layout>
        </v-card>
    </DialogEx>
</template>
<script lang="ts">
import { Vue, Component, Mixins, Watch } from 'vue-property-decorator'
import DialogHelper from '@/renderer/mixins/dialog-helper'
import { Entities } from '@/renderer/database'
import BigNumber from 'bignumber.js'
import debounce from 'lodash.debounce'
import { estimateGas, buildTx, EstimateGasResult } from '../tx-utils'
import AccountLoader from '@/renderer/mixins/account-loader'

type Arg = {
    message: Connex.Vendor.SigningService.TxMessage,
    wallets: Entities.Wallet[],
    selectedWallet: number
    suggestedGas: number
    txComment: string
}

type Result = {
    txId: string
    rawTx: string
    signer: string
    estimatedFee: string
}

@Component
export default class TxSigningDialog extends Mixins(class extends DialogHelper<Arg, Result>{ }, AccountLoader) {
    opened = false
    signing = false
    estimating = false
    estimation = {
        gas: 0,
        reverted: false,
        vmError: '',
        baseGasPrice: new BigNumber(0),
        error: ''
    }
    password = ''
    passwordError = ''
    readonly passwordRules = [(v: string) => !!v || 'Input password here']
    gasPriceCoef = 0
    estimateGasSeq = 0
    estimateGasCache = new Map<string, EstimateGasResult>()
    debouncedEstimateGas!: () => void

    get suggestedGas() { return this.arg.suggestedGas }
    get txComment() { return this.arg.txComment }
    get wallets() { return this.arg.wallets }
    get wallet() { return this.wallets[this.arg.selectedWallet] }
    get address() { return this.wallet.address! }
    get clauses() { return this.arg.message }
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

    @Watch('password')
    passwordChanged() {
        this.passwordError = ''
    }

    @Watch('arg.selectedWallet')
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
                result = await estimateGas(this.clauses, this.suggestedGas, addr)
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

    created() {
        this.debouncedEstimateGas = debounce(() => this.estimateGas(), 500)
        this.estimateGas()
    }

    mounted() {
        this.opened = true
    }

    get passwordInputElem() {
        return (this.$refs.passwordElem as Vue).$el.querySelector('input')!
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

            this.opened = false
            this.$resolve({ ...result, signer: this.address!, estimatedFee: this.fee.toString(10) })
        } catch (err) {
            console.warn(err)
            if (err.message === 'message authentication code mismatch') {
                this.passwordError = 'Incorrect password'
                setTimeout(() => {
                    this.passwordInputElem.select()
                }, 0)
            }
        } finally {
            this.signing = false
        }
    }

    decline() {
        if (this.signing) {
            return
        }
        this.opened = false
        this.$reject(new Rejected('user cancelled'))
    }
}

class Rejected extends Error {
    constructor(msg: string) {
        super(msg)
        this.name = Rejected.name
    }
}
</script>
<style >
.sign-dialog {
    position: fixed;
    right: 0;
    bottom: 0;
    width: auto;
}
.sign-dialog-transition-enter,
.sign-dialog-transition-leave-to {
    transform: translateY(calc(100% + 40px));
}
</style>
