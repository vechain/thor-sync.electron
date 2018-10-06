<template>
    <v-dialog v-bind="$attrs" v-on="$listeners" v-model="opened" @keydown.esc="onKeyEsc" @keydown.enter="onKeyEnter">
        <v-card>
            <v-card-text>
                <div class="subheading font-weight-light">Create Wallet</div>
                <v-stepper v-if="step<4" v-model="step" class="elevation-0" style="min-height: 400px;">
                    <v-stepper-header class="elevation-0">
                        <v-stepper-step :complete="step > 1" step="1" />
                        <v-divider />
                        <v-stepper-step :complete="step > 2" step="2" />
                        <v-divider />
                        <v-stepper-step :complete="step > 3" step="3" />
                    </v-stepper-header>
                    <div class="title font-weight-light pl-4">
                        {{['Personalize', 'Write down mnemonic words', 'Verify mnemonic words'][step-1]}}
                    </div>
                    <v-stepper-items>
                        <v-stepper-content step="1">
                            <NameAndPass v-model="nameAndPass" v-if="opened" />
                        </v-stepper-content>
                        <v-stepper-content step="2">
                            <MnemonicWords :words="words" v-if="opened" />
                        </v-stepper-content>
                        <v-stepper-content step="3">
                            <WordPuzzle :words="words" v-model="puzzleSovled" v-if="opened" />
                        </v-stepper-content>
                    </v-stepper-items>
                </v-stepper>
                <div v-else style="height: 400px;">
                    <template v-if="opened">
                        <v-layout v-if="result && result.entity" column align-center justify-center fill-height>
                            <span class="headline font-weight-light">Congratulations</span>
                            <div class="py-3">
                                <v-icon small color="success">mdi-check-decagram</v-icon> <span>wallet created!</span>
                            </div>
                            <v-card flat class="elevation-8">
                                <v-card-text>
                                    <v-layout column align-center>
                                        <IdentIcon style="border-radius:10px;" :address="checksumedAddress"></IdentIcon>
                                        <v-flex pt-2 headline>
                                            {{nameAndPass.name}}
                                        </v-flex>
                                        <v-flex pb-2>
                                            <span style="font-family: 'Roboto Mono', monospace;font-size: 10px;">{{checksumedAddress}}</span>
                                        </v-flex>
                                        <v-flex>
                                            <QRCode :content="checksumedAddress" size="100"></QRCode>
                                        </v-flex>
                                    </v-layout>
                                </v-card-text>
                            </v-card>
                        </v-layout>
                        <v-layout v-else-if="result" column align-center justify-center fill-height>
                            {{result.err}}
                        </v-layout>
                        <v-layout v-else column align-center justify-center fill-height>
                            <p>Processing... a monent</p>
                            <v-progress-linear color="success" indeterminate></v-progress-linear>
                        </v-layout>
                    </template>
                </div>
            </v-card-text>
            <v-card-actions>
                <v-btn flat :disabled="!abortBtn.enabled" v-show="abortBtn.visible" @click="abortBtn.action">{{abortBtn.text}}</v-btn>
                <v-spacer />
                <v-btn flat :disabled="!backBtn.enabled" v-show="backBtn.visible" @click="backBtn.action">{{backBtn.text}}</v-btn>
                <v-btn flat color="primary" :disabled="!nextBtn.enabled" v-show="nextBtn.visible" @click="nextBtn.action">{{nextBtn.text}}</v-btn>
            </v-card-actions>
        </v-card>
        <slot slot="activator" name="activator" />
    </v-dialog>
</template>
<script lang="ts">
import { Vue, Component, Prop, Watch, Model } from 'vue-property-decorator'
import NameAndPass from './NameAndPass.vue'
import MnemonicWords from './MnemonicWords.vue'
import WordPuzzle from './WordPuzzle.vue'

import { cry } from 'thor-devkit'
import Wallet from '../wallet'
import QRCode from '../components/QRCode.vue'
import IdentIcon from '../components/IdentIcon.vue'

@Component({
    components: {
        NameAndPass,
        MnemonicWords,
        WordPuzzle,
        QRCode,
        IdentIcon
    }
})
export default class NewWalletDialog extends Vue {
    @Model('input') value!: boolean
    @Watch('value')
    valueChanged() {
        this.opened = this.value
    }

    opened = false
    step = 1
    nameAndPass: NameAndPass.Value = { name: "", password: "" }
    words = generateWords()
    puzzleSovled = false
    result: Result | null = null

    @Watch('opened')
    reset() {
        this.step = 1
        this.nameAndPass = { name: "", password: "" }
        this.words = generateWords()
        this.result = null
    }

    get abortBtn() {
        const state: BtnState = {
            visible: false,
            enabled: false,
            text: 'Abort',
            action: () => { this.opened = false }
        }
        switch (this.step) {
            case 1:
            case 2:
            case 3:
                state.visible = state.enabled = true
                break
        }
        return state
    }

    get backBtn() {
        const state: BtnState = {
            visible: false,
            enabled: false,
            text: 'Back',
            action: () => { this.step-- }
        }
        switch (this.step) {
            case 3:
                state.visible = state.enabled = true
                break
        }
        return state
    }

    get nextBtn() {
        const state: BtnState = {
            visible: true,
            enabled: true,
            text: 'Next',
            action: () => { this.step++ }
        }
        switch (this.step) {
            case 1:
                state.enabled = !!this.nameAndPass.valid
                break
            case 3:
                state.enabled = this.puzzleSovled || ENV.devMode
                state.text = 'Create'
                state.action = () => {
                    this.step++
                    this.encryptAndSave()
                }
                break
            case 4:
                state.text = 'Done'
                state.action = () => { this.opened = false }
                break
        }
        return state
    }

    async encryptAndSave() {
        try {
            const privateKey = cry.mnemonic.derivePrivateKey(this.words)

            const ks = await cry.Keystore.encrypt(privateKey, this.nameAndPass.password)
            const entity = {
                name: this.nameAndPass.name,
                address: '0x' + ks.address,
                keystore: ks
            }
            await WALLETS.save(entity).then(() => entity)
            this.result = { entity }
        } catch (err) {
            this.result = { err }
        }
    }
    get checksumedAddress() {
        if (this.result && this.result.entity) {
            return cry.toChecksumAddress(this.result.entity.address)
        }
        return null
    }

    onKeyEnter() {
        const state = this.nextBtn
        if (state.visible && state.enabled) {
            state.action()
        }
    }
    onKeyEsc() {
        const state = this.abortBtn
        if (state.visible && state.enabled) {
            state.action()
        }
    }
}

type BtnState = {
    visible: boolean
    enabled: boolean
    text: string
    action: () => void
}

type Result = {
    err?: Error
    entity?: Wallet.Entity
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
