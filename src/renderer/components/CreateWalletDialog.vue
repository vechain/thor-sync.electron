<template>
    <DialogEx persistent v-model="opened" width="780" @action:ok="onOK" @action:cancel="onCancel">
        <v-card>
            <v-card-text>
                <v-layout column style="height:400px">
                    <div class="subheading font-weight-light">Create Wallet</div>
                    <v-stepper v-if="step<4" class="elevation-0" v-model="step">
                        <v-stepper-header class="elevation-0">
                            <v-stepper-step :complete="step > 1" step="1"/>
                            <v-divider/>
                            <v-stepper-step :complete="step > 2" step="2"/>
                            <v-divider/>
                            <v-stepper-step :complete="step > 3" step="3"/>
                        </v-stepper-header>
                        <div class="title font-weight-light pl-4">{{stepTitles[step-1]}}</div>
                        <v-stepper-items>
                            <v-stepper-content step="1">
                                <v-form ref="form">
                                    <v-text-field
                                        validate-on-blur
                                        label="Wallet name"
                                        v-model="name"
                                        :rules="nameRules"
                                    ></v-text-field>
                                    <v-text-field
                                        validate-on-blur
                                        label="Password"
                                        type="password"
                                        v-model="password"
                                        :rules="passwordRules"
                                    ></v-text-field>
                                    <v-text-field
                                        validate-on-blur
                                        label="Repeat password"
                                        type="password"
                                        v-model="repeatedPassword"
                                        :rules="repeatedPasswordRules"
                                    ></v-text-field>
                                </v-form>
                            </v-stepper-content>
                            <v-stepper-content step="2">
                                <MnemonicWords :words="words"/>
                            </v-stepper-content>
                            <v-stepper-content step="3">
                                <WordPuzzle :words="words" v-model="puzzleSovled"/>
                            </v-stepper-content>
                        </v-stepper-items>
                    </v-stepper>
                    <v-layout v-else column>
                        <v-layout v-if="wallet" column align-center justify-center fill-height>
                            <span class="headline font-weight-light">Congratulations</span>
                            <div class="py-3">
                                <v-icon small color="success">mdi-check-decagram</v-icon>
                                <span>This is your new wallet!</span>
                            </div>
                            <WalletCard
                                flat
                                class="outline"
                                style="border-radius:9px;width:170px;"
                                :wallet="wallet"
                            />
                            <QRCode :size="80" class="mt-3">{{wallet.address | checksum}}</QRCode>
                        </v-layout>
                        <v-layout
                            v-else-if="error"
                            column
                            align-center
                            justify-center
                            fill-height
                        >{{result.err}}</v-layout>
                        <v-layout v-else column align-center justify-center fill-height>
                            <p>Processing... a monent</p>
                            <v-progress-linear color="success" indeterminate></v-progress-linear>
                        </v-layout>
                    </v-layout>
                </v-layout>
            </v-card-text>
            <v-card-actions>
                <v-spacer/>
                <v-btn
                    v-show="step<4"
                    ref="abort"
                    class="mr-5"
                    flat
                    @click="onAbort"
                    tabindex="2"
                >Abort</v-btn>
                <v-btn v-show="step<4" flat @click="onBack" tabindex="1">Back</v-btn>
                <v-btn
                    ref="next"
                    :disabled="processing"
                    flat
                    color="primary"
                    @click="onNext"
                >{{(step > 3 && !processing) ? 'Done' : 'Next'}}</v-btn>
            </v-card-actions>
        </v-card>
    </DialogEx>
</template>
<script lang="ts">
import { Vue, Component, Mixins, Watch } from 'vue-property-decorator'
import DialogHelper from '@/renderer/mixins/dialog-helper'
import { Entities } from '@/renderer/database';
import { cry } from 'thor-devkit'

@Component
export default class CreateWalletDialog extends Mixins(class extends DialogHelper<void, Entities.Wallet | null>{ }) {
    opened = false
    step = 1
    stepTitles = ['Personalize', 'Write down mnemonic words', 'Verify mnemonic words']
    name = ''
    password = ''
    repeatedPassword = ''
    words = generateWords()
    puzzleSovled = false
    wallet: Entities.Wallet | null = null
    error: Error | null = null

    get processing() {
        return this.step > 3 && !this.wallet && !this.error
    }
    readonly nameRules = [
        (val: string) => (!!val && !!val.trim()) || 'Requires non-empty name'
    ]
    readonly passwordRules = [
        (val: string) => (!!val && val.length >= 6) || 'Requires at least 6 characters'
    ]
    get repeatedPasswordRules() {
        return [
            (val: string) => (val === this.password) || 'Password mismatch'
        ]
    }

    mounted() {
        this.opened = true
    }

    close(result: Entities.Wallet | null) {
        this.$resolve(result)
        this.opened = false
    }

    onNext() {
        if (this.processing) {
            return
        }

        if (this.step === 1) {
            if (!(this.$refs.form as any).validate()) {
                return
            }
        } else if (this.step === 2) {
        } else if (this.step === 3) {
            if (!this.puzzleSovled && !ENV.devMode) {
                return
            }
            this.encryptAndSave()
        } else {
            this.close(this.wallet)
            return
        }
        this.step++
    }

    onAbort() {
        if (this.step > 3) {
            return
        }
        this.close(null)
    }

    onBack() {
        if (this.step < 2) {
            return
        }
        this.step--
    }

    onOK() {
        const el = (this.$refs.next as Vue).$el
        el.focus()
        el.click()
    }

    onCancel() {
        const el = (this.$refs.abort as Vue).$el
        el.focus()
        el.click()
    }

    async encryptAndSave() {
        try {
            const privateKey = cry.mnemonic.derivePrivateKey(this.words)
            const ks = await cry.Keystore.encrypt(privateKey, this.password)
            const entity = {
                name: this.name,
                address: '0x' + ks.address,
                keystore: ks,
                createdTime: Date.now()
            }
            await BDB.wallets.add(entity)
            this.wallet = entity
        } catch (err) {
            this.error = err
        }
    }
}

function generateWords() {
    for (; ;) {
        // to avoid duplicated words
        const words = cry.mnemonic.generate()
        const map: { [i: string]: any } = []
        if (words.every(w => {
            if (map[w]) {
                return false
            }
            map[w] = 1
            return true
        })) {
            return words
        }
    }
}
</script>

