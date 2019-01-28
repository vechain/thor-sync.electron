<template>
    <DialogEx persistent @action:ok="onOk" @action:cancel="abort" v-model="show" max-width="600px">
        <slot slot="activator" name="activator"/>
        <v-card>
            <v-card-title class="subheading">Import Wallet</v-card-title>
            <v-card-text class="pt-0">
                <v-stepper class="elevation-0" v-model="step">
                    <v-stepper-header class="elevation-0" v-show="false">
                        <v-stepper-step :complete="step > 1" step="1"></v-stepper-step>
                        <v-divider/>
                        <v-stepper-step :complete="step > 2" step="2"></v-stepper-step>
                    </v-stepper-header>
                    <div
                        class="title font-weight-light pl-4 pt-4"
                    >{{['Please select a method to import your wallet', 'Please fill in the fields below to import the wallet'][step-1]}}</div>
                    <v-stepper-items>
                        <v-stepper-content step="1" class="pt-0">
                            <ContentForm v-if="step === 1" ref="pk" :disabled="processing" v-model="content"></ContentForm>
                        </v-stepper-content>
                        <v-stepper-content step="2">
                            <NameAndPass ref="np" :disabled="processing" v-model="nameAndPass"></NameAndPass>
                            <v-checkbox
                                v-if="addressExist"
                                :ripple="false"
                                @change="overWriteCheck"
                                :error-messages="overWriteErrorMsg"
                                persistent-hint
                                color="warning"
                                v-model="overWrite"
                                :disabled="processing"
                            >
                                <span
                                    slot="label"
                                    class="warning--text"
                                >The wallet already existed. I agree to overwrite the wallet.</span>
                            </v-checkbox>
                        </v-stepper-content>
                    </v-stepper-items>
                </v-stepper>
            </v-card-text>
            <v-divider/>
            <v-card-actions>
                <v-btn small :disabled="processing" flat @click="abort">Abort</v-btn>
                <v-spacer/>
                <v-btn
                    @click="nextMove"
                    :disabled="processing"
                    ref="submit"
                    small
                    :flat="!processing"
                    class="primary"
                >{{ preBtnStatus.text }}</v-btn>
            </v-card-actions>
        </v-card>
    </DialogEx>
</template>
<script lang="ts">
import { Vue, Component, Watch, Mixins } from 'vue-property-decorator'
import ContentForm from '../launcher/WalletContentForm.vue'
import NameAndPass from '../launcher/NameAndPass.vue'
import { cry } from 'thor-devkit'
import DialogHelper from '@/renderer/mixins/dialog-helper'

@Component({
    components: {
        ContentForm,
        NameAndPass
    }
})
export default class ImportWalletDialog extends Mixins(
    class extends DialogHelper<any, void> { }
) {
    addressExist = false
    show = false
    overWrite = false
    overWriteErrorMsg: string[] = []
    step = 1
    pk?: Buffer
    nameAndPass: NameAndPass.Value = { name: '', password: '' }
    content: WalletContentForm.Value = {
        type: 0,
        pwd: '',
        content: ''
    }

    processing = false
    @Watch('show')
    onShowChange() {
        if (!this.show) {
            this.$resolve(undefined)
        }
    }
    mounted() {
        this.show = true
    }
    get preBtnStatus() {
        return {
            text: this.step === 1 ? 'Next' : 'Import'
        }
    }

    abort() {
        if (this.processing) {
            return
        }
        this.show = false
    }

    overWriteCheck() {
        if (this.addressExist) {
            this.overWriteErrorMsg = !this.overWrite
                ? ['Please check the box to proceed']
                : []
            return this.overWrite
        } else {
            return true
        }
    }

    checkStep2() {
        const form = this.$refs.np as NameAndPass
        const formV = form.valid
        const owV = this.overWriteCheck()
        return formV && owV
    }

    onOk() {
        const btn = (this.$refs.submit as Vue).$el
        btn.focus()
        btn.click()
    }

    async nextMove() {
        if (this.processing) {
            return
        }

        try {
            this.processing = true
            if (this.step === 1) {
                const form = this.$refs.pk as ContentForm
                if (!form.valid()) {
                    return
                }
                try {
                    this.pk = await form.getPrivateKey()
                    const address = cry.publicKeyToAddress(
                        cry.secp256k1.derivePublicKey(this.pk)
                    )
                    const count = await BDB.wallets
                        .where('address')
                        .equals('0x' + address.toString('hex'))
                        .count()
                    if (count) {
                        this.addressExist = true
                    }
                } catch (error) {
                    LOG.error(error)
                    return
                }
                this.step = 2
            } else {
                if (!this.checkStep2()) {
                    return
                }
                try {
                    const privateKey = this.pk

                    const ks = await cry.Keystore.encrypt(
                        privateKey!,
                        this.nameAndPass.password
                    )
                    const entity = {
                        name: this.nameAndPass.name,
                        address: '0x' + ks.address,
                        keystore: ks,
                        createdTime: Date.now()
                    }
                    if (this.addressExist) {
                        await BDB.wallets
                            .where('address')
                            .equals(entity.address)
                            .modify({
                                keystore: entity.keystore,
                                name: entity.name
                            })
                    } else {
                        await BDB.wallets.add(entity)
                    }

                    this.show = false
                } catch (err) {
                    LOG.error(err)
                    return
                }
            }
        } finally {
            this.processing = false
        }
    }
}
</script>

