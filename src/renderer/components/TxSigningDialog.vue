<template>
    <DialogEx
        persistent
        content-class="sign-dialog"
        v-model="opened"
        @action:ok="goNext"
        @action:cancel="decline"
        transition="sign-dialog-transition"
        width="700px"
        height="490px"
    >
        <v-card class="bg">
            <v-layout column style="height:495px;">
                <v-layout
                    column
                    justify-start
                    class="pb-3"
                    style="
                        overflow: auto;
                        background-color:rgba(0,0,0,0.1);
                        position: absolute;
                        height: 315px;
                        width: 100%;
                        top: 180px
                    "
                >
                    <v-layout column style="flex:0 1 auto" class="py-1">
                        <Tip v-if="estimation.error" class="ma-1" type="error">
                            <v-layout>
                                Error got while estimating fee
                                <v-spacer />
                                <v-btn icon small class="my-0" @click="reestimateGas">
                                    <v-icon small>refresh</v-icon>
                                </v-btn>
                            </v-layout>
                            <i>{{estimation.error}}</i>
                        </Tip>
                        <Tip v-if="insufficientEnergy" class="ma-1" type="warning">
                            <strong>Insufficient energy</strong>
                        </Tip>
                        <Tip v-if="estimation.reverted" class="ma-1" type="warning">
                            <strong>Transaction may fail/revert</strong>
                            <br />
                            <i>VM error: {{estimation.vmError}}</i>
                            <br />
                            <i v-if="estimation.revertReason">"{{estimation.revertReason}}"</i>
                        </Tip>
                        <Tip
                            class="ma-1"
                            v-if="!isLocal && connected && !delegation.calling"
                            type="info"
                        >Please double check the transaction and confirm on your device</Tip>
                        <TxListForDialog
                            v-show="step === 1"
                            :clauses="clauses"
                            :txComment="txComment"
                        />
                        <template v-if="step === 2">
                            <v-card-text
                                v-show="!!arg.delegationHandler && !ledgerError"
                                style="text-align: center"
                            >
                                <div style="min-width:50%">
                                    <div v-show="delegation.calling">
                                        <v-progress-circular indeterminate color="green" size="20" />
                                        <span>Contacting fee delegator ...</span>
                                    </div>
                                </div>
                                <b
                                    v-show="!!delegation.error"
                                    class="error--text"
                                >Failed to connect delegator, tx fee will be paid by you.</b>
                                <b
                                    v-show="!!delegation.signature && (isLocal || connected)"
                                    class="green--text"
                                >Tx fee will be paid by app!!!</b>
                            </v-card-text>
                            <template v-if="!isLocal && !delegation.calling">
                                <div
                                    v-show="!connected && !ledgerError"
                                    style="width: 500px; margin: auto"
                                    class="text-md-center pt-1"
                                >
                                    <h3>Please connecting to device</h3>
                                    <LedgerStatus
                                        ref="ledgerStatus"
                                        :publicKey="currentGroup.key"
                                        @deviceInfo="onConnectedLedger"
                                        @timeout="onLedgerTimeout"
                                        style="background: transparent"
                                    />
                                </div>
                                <TxListForDialog
                                    v-if="!isLocal"
                                    v-show="connected && !ledgerError"
                                    :clauses="clauses"
                                    :txComment="txComment"
                                />
                                <div class="text-md-center pt-1" style="width: 500px; margin: auto" v-if="!!ledgerError">
                                    <v-icon color="error" class="display-3">mdi-alert-circle-outline</v-icon>
                                    <p class="error--text">{{ledgerError.message}}</p>
                                    <p class="grey--text text--darken-1">
                                        For more information please visit
                                        <a
                                            @click="openTroubleshooting"
                                            href="javascript:;"
                                        >Ledger troubleshooting</a>
                                    </p>
                                </div>
                            </template>
                            <template
                                v-if="isLocal || (isLocal && !!arg.delegationHandler && !delegation.calling)"
                            >
                                <v-card-text
                                    style="width: 500px; margin: auto"
                                    class="pt-4"
                                    v-show="!privateKey"
                                >
                                    <p
                                        style="text-align: center; font-size: 16px;margin-bottom: 50px"
                                    >Please input your wallet's password to sign the transaction</p>
                                    <div style="width: 350px; margin: auto">
                                        <v-text-field
                                            v-focus
                                            :disabled="signing"
                                            v-model="password"
                                            label="Password"
                                            type="password"
                                            maxlength="20"
                                            :error-messages="passwordError"
                                            ref="passwordElem"
                                            @focus="onPasswordFocused"
                                        />
                                        <v-checkbox
                                            class="mt-1"
                                            color="primary"
                                            hide-details
                                            label="Keep unlocked for 5 minutes"
                                            v-model="keepUnlocked"
                                        />
                                    </div>
                                </v-card-text>
                                <v-card-text
                                    v-show="!!privateKey"
                                    class="text-xs-center mt-4 subheading"
                                >
                                    <p class="title">Please sign the transaction</p>
                                    <v-icon class="mr-2 display-2">mdi-lock-open</v-icon>
                                    <p class="grey--text text--darken-1">The wallet is unlocked</p>
                                </v-card-text>
                            </template>
                        </template>
                    </v-layout>
                </v-layout>
                <div style="position:absolute;left:0;bottom: 44px; width: 100%">
                    <v-progress-linear
                        v-show="signing"
                        class="ma-0"
                        height="2"
                        color="success"
                        indeterminate
                    />
                </div>
                <div class="signing-content-top">
                    <v-menu :disabled="step === 2 || groups.length === 1" offset-y>
                        <template>
                            <v-btn
                                small
                                :disabled="step === 2 || groups.length === 1"
                                :flat="!(step === 2 || groups.length === 1)"
                                slot="activator"
                            >
                                {{currentGroup.name}}
                                <v-icon right>mdi-menu-down</v-icon>
                            </v-btn>
                        </template>
                        <v-list>
                            <v-list-tile v-for="(item, index) in groups" :key="index">
                                <v-list-tile-content>
                                    <v-btn small flat @click="onGroupSelect(item)">{{ item.name }}</v-btn>
                                </v-list-tile-content>
                            </v-list-tile>
                        </v-list>
                    </v-menu>
                    <v-layout row>
                        <v-layout column align-content-center>
                            <v-card-text style="width: 300px; padding: 10px; margin: auto">
                                <WalletSeeker
                                    full-size
                                    :wallets="wallets"
                                    v-model="seekIndex"
                                    :noseek="(step === 2) || !!arg.selectedWallet"
                                />
                            </v-card-text>
                        </v-layout>
                        <v-layout align-content-center column>
                            <v-divider
                                style="margin: 20px auto; max-height: calc(100% - 40px);"
                                inset
                                :vertical="true"
                            ></v-divider>
                        </v-layout>
                        <v-layout column>
                            <v-card-text style="width: 300px; padding: 10px; margin: auto">
                                <v-layout>
                                    <span class="caption grey--text">Total value</span>
                                    <v-spacer />
                                    <Amount prepend="-" sym=" VET  ">{{value.toString(10)}}</Amount>
                                </v-layout>
                                <v-layout>
                                    <span class="caption grey--text">Estimated fee</span>
                                    <v-spacer />
                                    <Tooltip bottom :disabled="!(estimation.gas>0)">
                                        <Amount
                                            prepend="-"
                                            sym=" VTHO "
                                            slot="activator"
                                        >{{fee.toString(10)}}</Amount>
                                        <span>Estimated gas {{estimation.gas}}</span>
                                    </Tooltip>
                                </v-layout>
                                <v-layout>
                                    <span class="caption grey--text">Priority</span>
                                    <v-spacer />
                                    <Priority
                                        v-model="gasPriceCoef"
                                        :readonly="signing || step === 2"
                                    />
                                </v-layout>
                            </v-card-text>
                        </v-layout>
                    </v-layout>
                </div>
                <div class="signing-content-bottom"></div>
            </v-layout>
            <v-card-actions style="flex: 0 0 auto;">
                <v-btn :disabled="signing && (isLocal || connected)" small flat @click="decline">Decline</v-btn>
                <v-spacer />
                <v-btn
                    dark
                    small
                    flat
                    class="green"
                    v-show="step === 1"
                    @click="goNext"
                    :disabled="delegation.calling"
                >Next</v-btn>
                <v-btn
                    v-show="step === 2"
                    small
                    flat
                    dark
                    :disabled="(signing || delegation.calling) && (isLocal || connected)"
                    class="secondary"
                    @click="back"
                >Back</v-btn>
                <v-btn
                    v-show="step === 2 && isLocal"
                    dark
                    small
                    flat
                    :disabled="!readyToSign || delegation.calling"
                    class="green"
                    @click="sign"
                >Sign</v-btn>
            </v-card-actions>
        </v-card>
    </DialogEx>
</template>
<script lang="ts">
import { Vue, Component, Mixins, Watch } from 'vue-property-decorator'
import DialogHelper from '@/renderer/mixins/dialog-helper'
import BigNumber from 'bignumber.js'
import debounce from 'lodash.debounce'
import { estimateGas, buildTx, EstimateGasResult } from '../tx-utils'
import AccountLoader from '@/renderer/mixins/account-loader'
import { describeClauses } from '@/common/formatter'
import { setUnlocked, getUnlocked } from '../unlocked'
import ledger from '@/common/ledger'
import LedgerStatus from './LedgerStatus.vue'
import * as Keystore from '@/common/keystore'
import { shell } from 'electron'

type walletList = {
    sectionName: string
    key?: string
    list: entities.Wallet[] | { name: string, address: string }[]
}[]
type Arg = {
    message: Connex.Driver.SignTxArg
    wallets: walletList
    selectedWallet: string
    suggestedGas: number
    txComment: string
    dependsOn: string | null
    delegationHandler?: Connex.Vendor.DelegationHandler
}

type Result = {
    txid: string
    rawTx: string
    signer: string
    estimatedFee: string
    timestamp: number
}

@Component
export default class TxSigningDialog extends Mixins(class extends DialogHelper<Arg, Result>{ }, AccountLoader) {
    opened = false
    signing = false
    estimating = false
    estimation = {
        gas: 0,
        reverted: false,
        revertReason: '',
        vmError: '',
        baseGasPrice: new BigNumber(0),
        error: ''
    }
    ledgerError: any = null
    password = ''
    passwordError = ''
    gasPriceCoef = 0
    estimateGasSeq = 0
    estimateGasCache = new Map<string, EstimateGasResult>()
    debouncedEstimateGas!: () => void
    keepUnlocked = false
    step = 1
    delegation = {
        calling: false,
        signature: '',
        error: null as (Error | null)
    }
    connected = false
    builtTx = null as ReturnType<typeof buildTx> | null
    seekIndex = 0
    currentGroup: {
        name: string,
        key: string
    } = {
            name: '',
            key: ''
        }
    get suggestedGas() { return this.arg.suggestedGas }
    get txComment() { return this.arg.txComment || describeClauses(this.arg.message) }
    get wallets(): entities.Wallet[] | { name: string, address: string }[] {
        const wallets = this.arg.wallets.find(item => { return item.key === this.currentGroup!.key })
        if (wallets) {
            return wallets.list
        } else {
            return []
        }
    }
    get isLocal() {
        return this.currentGroup.key === 'local'
    }
    get groups() {
        return this.arg.wallets.map(item => {
            return {
                name: item.sectionName,
                key: item.key
            }
        })
    }
    get lastSigner() {
        return this.$store.getters.lastSigner
    }
    get wallet(): entities.Wallet | { name: string, address: string } | null {
        if (this.wallets.length) {
            return this.wallets[this.seekIndex] || null
        } else {
            return null
        }
    }
    get address() { return this.wallet ? this.wallet.address : '' }

    // wallet = this.wallets[0]
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
            this.estimation.gas
    }

    get privateKey() {
        const _wallet = this.wallet as entities.Wallet
        return getUnlocked(_wallet.id! || -1)
    }

    onLedgerTimeout() {
        this.signing = false
        this.ledgerError = new Error('Unable to connect your devce, please retry!')
        // this.back()
    }

    @Watch('password')
    passwordChanged() {
        this.passwordError = ''
    }

    @Watch('$store.state.chainHead')
    headChanged() {
        this.debouncedEstimateGas()
    }

    @Watch('currentGroup')
    setWalletThings() {
        const i = this.wallets.findIndex(w => { return w.address === (this.arg.selectedWallet || this.lastSigner) })
        this.reestimateGas()
        this.seekIndex = i < 0 ? 0 : i
    }
    @Watch('seekIndex')
    reestimateGas() {
        this.estimation.gas = 0
        this.estimation.error = ''
        this.estimation.vmError = ''
        this.estimation.baseGasPrice = new BigNumber(0)
        this.estimation.reverted = false
        this.estimation.revertReason = ''

        if (this.estimateGasCache.get(this.address!)) {
            this.estimateGas()
        } else {
            this.debouncedEstimateGas()
        }
    }

    onGroupSelect(item: { name: string, key: string }) {
        this.currentGroup = item
    }

    onConnectedLedger(r: any) {
        if (r.publicKey === this.currentGroup.key) {
            setTimeout(() => {
                this.connected = true
                this.ledgerSign()
            }, 700)
        } else {
            this.signing = false
        }
    }

    openTroubleshooting() {
        shell.openExternal(
            'https://docs.vechain.org/sync/user-guide/import-ledger.html#troubleshooting'
        )
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
                this.estimation.revertReason = result.revertReason
                this.estimation.vmError = result.vmError
                this.estimation.error = ''
            }
        } catch (err) {
            LOG.warn('TxSigningDialog:', 'estimateGas error', err)
            if (seq === this.estimateGasSeq) {
                this.estimation.error = err.message
            }
        } finally {
            if (seq === this.estimateGasSeq) {
                this.estimating = false
            }
        }
    }

    getDefaultGroup() {
        if (this.arg.wallets.length > 1) {
            const group = this.arg.wallets.find(item => {
                const temp = item.list.find(wallet => {
                    return wallet.address === this.lastSigner
                })
                return !!temp
            })
            if (group) {
                return {
                    key: group.key!,
                    name: group.sectionName
                }
            }
        }
        return {
            key: this.arg.wallets[0].key!,
            name: this.arg.wallets[0].sectionName
        }
    }

    created() {
        this.debouncedEstimateGas = debounce(() => this.estimateGas(), 500)
        this.setWalletThings()
        this.currentGroup = this.getDefaultGroup()
        this.estimateGas()
    }

    mounted() {
        this.opened = true
    }

    get passwordInputElem() {
        return (this.$refs.passwordElem as Vue).$el.querySelector('input')!
    }
    async goNext() {
        if (this.step === 1) {
            this.step++
            await this.buildTx()
            if (!this.isLocal) {
                this.signing = true
            }
        } else {
            await this.sign()
        }
    }
    back() {
        this.step--
        this.keepUnlocked = false
        this.password = ''
        this.signing = false
        this.connected = false
        this.ledgerError = null
    }

    async buildTx() {
        this.builtTx = null
        this.delegation.signature = ''
        this.delegation.error = null

        const builtTx = buildTx(this.clauses, this.gasPriceCoef, this.estimation.gas, this.arg.dependsOn)
        if (this.arg.delegationHandler) {
            try {
                this.delegation.calling = true
                const r = await Promise.race([
                    this.arg.delegationHandler({
                        raw: '0x' + builtTx.unsignedTx(true).encode().toString('hex'),
                        origin: this.wallet!.address
                    }),
                    new Promise<{ signature: string }>((_, reject) => {
                        setTimeout(() => reject(new Error('timeout')), 10000)
                    })
                ])
                this.delegation.signature = r.signature
            } catch (err) {
                this.delegation.error = err
            } finally {
                this.delegation.calling = false
            }
        }
        this.builtTx = builtTx
    }

    async sign() {
        if (this.isLocal) {
            await this.localSign()
        } else {
            await this.ledgerSign()
        }
    }

    async localSign() {
        if (!this.readyToSign) {
            return
        }
        if (!this.privateKey && !this.password) {
            this.passwordError = 'Input password here'
            return
        }

        const _wallet = this.wallet as entities.Wallet

        try {
            this.signing = true
            this.passwordError = ''

            let privateKey
            if (this.privateKey) {
                privateKey = this.privateKey
                setUnlocked(_wallet.id!, privateKey)
            } else {
                privateKey = await Keystore.decrypt(_wallet.keystore, this.password)
                if (this.keepUnlocked) {
                    setUnlocked(_wallet.id!, privateKey)
                }
            }

            const timestamp = connex.thor.status.head.timestamp
            const signedTx = this.builtTx!.signTx(privateKey, this.delegation.signature)
            const result = {
                txid: signedTx.id!,
                rawTx: '0x' + signedTx.encode().toString('hex')
            }

            this.opened = false
            this.$resolve({
                ...result,
                signer: this.address!,
                estimatedFee: this.fee.toString(10),
                timestamp
            })
        } catch (err) {
            LOG.warn('TxSigningDialog:', 'sign error', err)
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

    async ledgerSign() {
        try {
            const tx = this.builtTx!.unsignedTx(this.delegation.signature ? true : false)

            tx.signature = await ledger.signTransaction(
                this.seekIndex,
                tx.encode(),
                this.delegation.signature
            )

            this.opened = false
            this.$resolve({
                txid: tx.id!,
                rawTx: '0x' + tx.encode().toString('hex'),
                signer: this.address!,
                estimatedFee: this.fee.toString(10),
                timestamp: connex.thor.status.head.timestamp
            })
        } catch (error) {
            console.log(error)
            LOG.log(error)
            // user decline
            if (error.statusText === 'CONDITIONS_OF_USE_NOT_SATISFIED' || error.name === 'DisconnectedDevice') {
                this.signing = false
                this.decline()
            } else {
                this.ledgerError = error
            }
        } finally {
            this.signing = false
        }
    }

    decline() {
        if (this.signing && (this.isLocal || this.connected)) {
            return
        }
        this.opened = false
        this.$reject(new Error('user cancelled'))
    }
    onPasswordFocused() {
        if (!this.password) {
            this.passwordError = ''
        }
    }
}

</script>
<style scoped>
.theme--dark .bg {
    background-color: #303030;
}
.signing-content-top {
    box-shadow: 0px 3px 6px 1px rgba(0, 0, 0, 0.15);
    height: 180px;
    position: absolute;
    top: 0;
    width: 100%;
}
.signing-content-bottom {
    box-shadow: 0px 2px 6px 1px rgba(0, 0, 0, 0.15);
    height: 44px;
    position: absolute;
    bottom: 0;
    width: 100%;
}
</style>
