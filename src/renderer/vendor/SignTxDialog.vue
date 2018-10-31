<template>
    <v-dialog
        content-class="bottom-right"
        persistent
        v-model="open"
        @keydown.enter="onAction(true)"
    >
        <v-card>
            <v-layout row style="height:480px;">
                <v-layout
                    column
                    text-xs-center
                    style="width:400px;flex:0 0 auto; background-color: rgba(0,0,0,0.15)"
                >
                    <v-card-text v-if="referer" style="flex:0 0 auto">{{referer.url}}</v-card-text>
                    <v-expansion-panel
                        expand
                        style="overflow-y:auto;border-radius:1px"
                        popout
                        class="px-1"
                    >
                        <ClauseItem v-for="(clause,i) in clauses" :key="i" :clause="clause"/>
                    </v-expansion-panel>
                </v-layout>
                <!-- <v-divider vertical /> -->
                <v-layout column v-if="!!selectedWallet" class="elevation-2" style="width:320px">
                    <v-card-text>
                        <WalletSeeker
                            :wallets="walletSwitchable?wallets: [selectedWallet]"
                            v-model="selectedWallet"
                        />
                    </v-card-text>
                    <v-spacer/>
                    <v-card-text>
                        <v-text-field
                            :disabled="signing"
                            v-model="gasInput"
                            label="Gas"
                            type="number"
                            step="1000"
                            validate-on-blur
                            :rules="gasInputRules"
                        />
                        <v-select
                            :disabled="signing"
                            v-model="priority"
                            :items="priorities"
                            item-text="title"
                            item-value="value"
                            :label="'Priority (Gas price coef): ' + priority"
                        />
                        <v-text-field
                            :disabled="signing"
                            v-model="password"
                            label="Password"
                            type="password"
                            :error-messages="passwordError"
                            validate-on-blur
                            :rules="passwordRules"
                        />
                    </v-card-text>
                    <v-progress-linear
                        class="ma-0"
                        :style="{visibility: signing?'visible': 'hidden'}"
                        height="2"
                        color="success"
                        indeterminate
                    />
                    <v-divider/>
                    <v-card-actions>
                        <v-spacer/>
                        <v-btn
                            :disabled="signing"
                            color="red darken-2"
                            flat
                            @click="onAction(false)"
                        >Decline</v-btn>
                        <v-btn
                            :disabled="signing || !inputValid"
                            color="green darken-1"
                            flat
                            @click="onAction(true)"
                        >Sign</v-btn>
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
import WalletSelection from '../components/WalletSelection.vue'
import AddressLabel from '../components/AddressLabel.vue'
import Amount from '../components/Amount.vue'
import ClauseItem from './ClauseItem.vue'
import WalletCard from '../components/WalletCard.vue'
import { normalizeClauses, normalizeTxSignOptions } from './utils'
import { Transaction, cry } from 'thor-devkit'
import { randomBytes } from 'crypto'
import BigNumber from 'bignumber.js'
import { Entities } from '@/renderer/database';
import WalletSeeker from '../components/WalletSeeker.vue'


const priorities: Array<{ title: string, value: number }> = [{
    title: 'Low',
    value: 0
}, {
    title: 'Normal',
    value: 127
}, {
    title: 'High',
    value: 191
}, {
    title: 'Highest',
    value: 255
}]

type Clause = Connex.Vendor.Message<'tx'>[number]

@Component({
    components: {
        WalletCard,
        WalletSelection,
        AddressLabel,
        Amount,
        ClauseItem,
        WalletSeeker
    }
})
export default class SignTxDialog extends Vue implements SignTx {
    private name: string = 'SignTxDialog'

    wallets: Entities.Wallet[] = []

    open = false
    password = ''
    signing = false
    passwordError = ''
    clauses: Clause[] = []
    options: Connex.Vendor.SignOptions<'tx'> = {}
    selectedWallet: Entities.Wallet | null = null
    result: Deferred<Connex.Vendor.SignResult<'tx'>> | null = null
    gasInput = ""
    referer: { url: string, title: string } | null = null

    priorities = priorities
    priority = 0

    @State walletsRevision!: number
    @Watch('walletsRevision')
    async reloadWallets() {
        this.wallets = await DB.wallets.toArray()
    }


    get walletSwitchable() {
        return !this.options.signer
    }

    get inputValid() {
        return this.gasInputRules.every(f => f(this.gasInput) === true) &&
            this.passwordRules.every(f => f(this.password) === true)
    }

    gasInputRules = [
        (v: string) => !!v || 'Empty not allowed',
        (v: string) => /^[0-9]+$/.test(v) || 'Integer value required'
    ]

    passwordRules = [
        (v: string) => !!v || 'Empty not allowed'
    ]

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
        this.result = null
        this.referer = null
    }

    created() {
        this.reloadWallets()
    }

    async signTx(
        clientId: string[],
        message: Connex.Vendor.Message<'tx'>,
        options: Connex.Vendor.SignOptions<'tx'>,
        referer: {
            url: string
            title: string
        }) {
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
                const found = this.wallets.find(w => w.address!.toLowerCase() === options!.signer!.toLowerCase())
                if (!found) {
                    throw new Error('bad options: no such signer')
                }
                return found
            }
            return this.wallets[0]
        })()

        this.clauses = message
        this.options = options
        this.gasInput = options.gas!.toString()
        this.referer = referer
        this.open = true

        this.result = new Deferred()
        return this.result
    }


    async onAction(confirmed: boolean) {
        if (this.signing) {
            return
        }
        if (confirmed) {
            if (!this.inputValid) {
                return
            }
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
                gas: '0x' + new BigNumber(this.gasInput, 10).toString(16),
                dependsOn: null,
                nonce: '0x' + randomBytes(8).toString('hex')
            })

            const privateKey = await cry.Keystore.decrypt(this.selectedWallet!.keystore!, this.password)
            tx.signature = cry.secp256k1.sign(cry.blake2b256(tx.encode()), privateKey)

            const txId = tx.id!
            const raw = '0x' + tx.encode().toString('hex')
            await DB.txRecords.add({
                id: txId,
                insertTime: Date.now(),
                signer: tx.signer!,
                confirmed: 0,
                raw,
                referer: { ...this.referer! },
                summary: [this.options.summary!, this.clauses.map(c => c.desc!)],
                link: this.options.link || '',
                receipt: null
            })
            connex.txQueue.send(txId, raw)

            this.result!.resolve({
                txId: tx.id!,
                signer: this.selectedWallet!.address!
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
  width: auto;
}
</style>
