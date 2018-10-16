<template>
    <v-dialog content-class="bottom-right" persistent v-model="open" max-width="700px" @keydown.enter="onAction(true)" @keydown.esc="onAction(false)">
        <v-card>
            <v-layout row style="height:470px;">
                <v-layout column text-xs-center style="width:400px;flex:0 0 auto; background-color: rgba(0,0,0,0.15)">
                    <v-card-text style="flex:0 0 auto">
                        domain
                    </v-card-text>
                    <v-expansion-panel expand style="overflow-y:auto;border-radius:1px" popout class="px-1">
                        <ClauseItem v-for="(clause,i) in clauses" :key="i" :clause="clause" />
                    </v-expansion-panel>
                </v-layout>
                <!-- <v-divider vertical /> -->
                <v-layout column v-if="!!selectedWallet" class="elevation-2">
                    <WalletSelection :disabled="signing || walletSwitchable" offset-overflow fixed right offset-y :wallets="wallets" v-model="selectedWallet" max-height="400px">
                        <v-layout column slot="activator" :disabled="signing">
                            <WalletCard tile flat :wallet="selectedWallet" />
                        </v-layout>
                    </WalletSelection>
                    <v-divider />
                    <v-spacer />
                    <v-card-text>
                        <v-text-field :disabled="signing" v-model="options.gas" label="Gas" />
                        <v-select :disabled="signing" v-model="priority" :items="priorities" item-text="title" item-value="value" :label="'Priority (Gas price coef): ' + priority" />
                        <v-text-field :disabled="signing" autofocus v-model="password" label="Password" type="password" :error-messages="passwordError" />
                    </v-card-text>
                    <v-progress-linear class="ma-0" :style="{visibility: signing?'visible': 'hidden'}" height="2" color="success" indeterminate />
                    <v-divider />
                    <v-card-actions>
                        <v-spacer />
                        <v-btn :disabled="signing" color="red darken-2" flat @click="onAction(false)">
                            Decline
                        </v-btn>
                        <v-btn :disabled="signing" color="green darken-1" flat @click="onAction(true)">
                            Sign
                        </v-btn>
                    </v-card-actions>
                </v-layout>
            </v-layout>
        </v-card>
    </v-dialog>
</template>
<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import { State } from 'vuex-class'
import Deferred from '@/common/deferred';
import Wallet from '../wallet'
import WalletSelection from '../components/WalletSelection.vue'
import AddressLabel from '../components/AddressLabel.vue'
import Amount from '../components/Amount.vue'
import ClauseItem from './ClauseItem.vue'
import WalletCard from '../components/WalletCard.vue'
import { normalizeClauses, normalizeTxSignOptions } from './utils'
import { Transaction, cry } from 'thor-devkit'
import { randomBytes } from 'crypto'

@Component({
    components: {
        WalletCard,
        WalletSelection,
        AddressLabel,
        Amount,
        ClauseItem
    }
})
export default class SignTxDialog extends Vue implements SignTx {
    private name: string = 'SignTxDialog'

    @State wallets!: Wallet.Entity[]

    open = false
    password = ''
    signing = false
    passwordError = ''
    clauses: Connex.Vendor.Clause[] = []
    options: Connex.Vendor.SignOptions<'tx'> = {}
    selectedWallet: Wallet.Entity | null = null
    result?: Deferred<Connex.Vendor.SignResult<'tx'>>


    priorities: Array<{ title: string, value: number }> = [{
        title: 'Low',
        value: 0
    }, {
        title: 'Normal',
        value: 128
    }, {
        title: 'High',
        value: 192
    }, {
        title: 'Highest',
        value: 255
    }]
    priority = 0

    get walletSwitchable() {
        return !!this.options.signer
    }

    @Watch('open')
    openUpdated(val: boolean) {
        if (!val) {
            this.reset()
        }
    }

    @Watch('password')
    passwordUpdated() {
        this.passwordError = ''
    }

    reset() {
        this.signing = false
        this.password = ''
        this.passwordError = ''
        this.clauses = []
        this.options = {}
        this.selectedWallet = null
        this.result = undefined
    }

    created() {
        if (this.wallets.length > 0) {
            this.selectedWallet = this.wallets[0]
        }
    }

    async signTx(
        clientId: string[],
        message: Connex.Vendor.Message<'tx'>,
        options?: Connex.Vendor.SignOptions<'tx'>) {
        // TODO check whether clientId is current viewport
        if (this.open) {
            throw new Error('busy')
        }
        if (this.wallets.length === 0) {
            throw new Error('rejected')
        }
        message = normalizeClauses(message)
        options = normalizeTxSignOptions(options)

        this.selectedWallet = (() => {
            if (options.signer) {
                const found = this.wallets.find(w => w.address.toLowerCase() === options!.signer!.toLowerCase())
                if (!found) {
                    throw new Error('bad options: no such signer')
                }
                return found
            }
            return this.wallets[0]
        })()

        this.clauses = message
        this.options = options

        this.open = true

        this.result = new Deferred()
        return this.result
    }


    async onAction(confirmed: boolean) {
        if (this.signing) {
            return
        }
        try {
            if (!confirmed) {
                throw new Error('rejected')
            }
            this.signing = true

            const genesis = connex.thor.genesis
            const bestId = connex.thor.status.head.id
            const tx = new Transaction({
                chainTag: Number.parseInt(genesis.id.slice(genesis.id.length - 2), 16),
                blockRef: bestId.slice(0, 18),
                expiration: 720,
                clauses: this.clauses.map(c => ({ to: c.to, value: c.value!, data: c.data! })),
                gasPriceCoef: this.priority,
                gas: this.options.gas!,
                dependsOn: null,
                nonce: '0x' + randomBytes(8).toString('hex')
            })

            const wallet = new Wallet(this.selectedWallet!)
            tx.signature = await wallet.sign(cry.blake2b256(tx.encode()), this.password)
            BUS.$emit('new-tx', {
                tx,

            })
            this.result!.resolve({
                txId: tx.id!,
                signer: this.selectedWallet!.address
            })
        } catch (err) {
            if (err.message === 'message authentication code mismatch') {
                this.passwordError = 'Incorrect password'
                return
            }
            this.result!.reject(err)
        } finally {
            this.signing = false
        }
        this.open = false
    }
}

</script>
<style scoped>
div >>> .bottom-right {
  position: fixed;
  right: 0;
  bottom: 0;
}
</style>
