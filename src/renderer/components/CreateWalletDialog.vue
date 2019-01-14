<template>
    <DialogEx persistent v-model="opened" width="780" @action:ok="onOK" @action:cancel="onCancel">
        <v-card>
            <v-card-title class="subheading">Create Wallet</v-card-title>
            <v-card-text style="height:380px" class="py-0">
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
                                    v-focus
                                    validate-on-blur
                                    label="Wallet name"
                                    v-model="name"
                                    :counter="20"
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
                <v-layout v-else column fill-height>
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
            </v-card-text>
            <v-divider/>
            <v-card-actions>
                <v-btn v-show="step<4" ref="abort" flat small @click="onAbort" tabindex="2">Abort</v-btn>
                <v-spacer/>
                <v-btn
                    small
                    v-show="step<4 && step>1"
                    class="secondary"
                    dark
                    flat
                    @click="onBack"
                    tabindex="1"
                >Back</v-btn>
                <v-btn
                    ref="next"
                    :disabled="processing"
                    flat
                    small
                    class="primary"
                    @click="onNext"
                >{{(step > 3 && !processing) ? 'Done' : 'Next'}}</v-btn>
            </v-card-actions>
        </v-card>
    </DialogEx>
</template>
<script lang="ts">
    import { Vue, Component, Mixins, Watch } from 'vue-property-decorator'
    import DialogHelper from '@/renderer/mixins/dialog-helper'
    import { cry } from 'thor-devkit'

    @Component
    export default class CreateWalletDialog extends Mixins(
        class extends DialogHelper<void, entities.Wallet | null> {}
    ) {
        opened = false
        step = 1
        stepTitles = [
            'Please fill in the fields below to create a wallet',
            'Mnemonic is used to recover your wallet, please write down the mnemonic words and stored in a secure place',
            'To make sure the mnemonic that your backup is correct, Please select the mnemonic words below to verify'
        ]
        name = ''
        password = ''
        repeatedPassword = ''
        words = generateWords()
        puzzleSovled = false
        wallet: entities.Wallet | null = null
        error: Error | null = null

        get processing() {
            return this.step > 3 && !this.wallet && !this.error
        }
        readonly nameRules = [
            (val: string) => (!!val && !!val.trim()) || 'Create a name that is simple enough to remember',
            (val: string) =>
                (!!val && !!val.trim() && val.trim().length <= 20) ||
                `Wallet's name is longer than 20 characters`
        ]
        readonly passwordRules = [
            (val: string) =>
                (!!val && val.length >= 6) || 'Requires at least 6 characters'
        ]
        get repeatedPasswordRules() {
            return [(val: string) => val === this.password || 'Password mismatch']
        }

        mounted() {
            this.opened = true
        }

        close(result: entities.Wallet | null) {
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
                if (!this.puzzleSovled) {
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
            if (this.step > 3 || this.processing) {
                return
            }
            this.close(null)
        }

        onBack() {
            if (this.step < 2 || this.processing) {
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
        for (;;) {
            // to avoid duplicated words
            const words = cry.mnemonic.generate()
            const map: { [i: string]: any } = []
            if (
                words.every(w => {
                    if (map[w]) {
                        return false
                    }
                    map[w] = 1
                    return true
                })
            ) {
                return words
            }
        }
    }
</script>

