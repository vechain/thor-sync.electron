<template>
    <DialogEx persistent @action:ok="onOk" @action:cancel="abort" v-model="show" max-width="550px">
        <slot slot="activator" name="activator"/>
        <v-card>
            <v-card-title class="subheading">Import Wallet</v-card-title>
            <v-card-text>
                <v-stepper class="elevation-0" v-model="step">
                    <v-stepper-header class="elevation-0">
                        <v-stepper-step :complete="step > 1" step="1"></v-stepper-step>
                        <v-divider/>
                        <v-stepper-step :complete="step > 2" step="2"></v-stepper-step>
                    </v-stepper-header>
                    <div
                        class="title font-weight-light pl-4"
                    >{{['Please select a method to import your wallet', 'Please fill in the fields below to import the wallet'][step-1]}}</div>
                    <v-stepper-items>
                        <v-stepper-content step="1">
                            <ContentForm ref="pk" v-model="content"></ContentForm>
                        </v-stepper-content>
                        <v-stepper-content step="2">
                            <NameAndPass ref="np" v-model="nameAndPass"></NameAndPass>
                            <v-checkbox
                                v-if="addressExist"
                                :ripple="false"
                                @change="overWriteCheck"
                                :error-messages="overWriteErrorMsg"
                                label="The wallet already existed, Please check the box to agree reset the wallet."
                                v-model="overWrite"
                            ></v-checkbox>
                        </v-stepper-content>
                    </v-stepper-items>
                </v-stepper>
            </v-card-text>
            <v-divider/>
            <v-card-actions>
                <v-btn small flat @click="abort">Abort</v-btn>
                <v-spacer/>
                <v-btn @click="nextMove" ref="submit" small flat class="primary">{{ preBtnStatus.text }}</v-btn>
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

        this.processing = true
        if (this.step === 1) {
            const form = this.$refs.pk as ContentForm
            if (!form.valid()) {
                this.processing = false
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
                this.processing = false
                LOG.error(error)
                return
            }
            this.step = 2
        } else {
            if (!this.checkStep2()) {
                this.processing = false
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
                this.processing = false
                LOG.error(err)
                return
            }
        }
        this.processing = false
    }
}
</script>

