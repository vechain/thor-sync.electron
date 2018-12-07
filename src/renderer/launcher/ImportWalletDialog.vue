<template>
    <v-dialog v-model="show" v-bind="$attrs" v-on="$listeners" max-width="500px">
        <slot slot="activator" name="activator"/>
        <v-card>
            <v-card-text>
                <div class="title font-weight-light">Import Wallet</div>
                <v-stepper class="elevation-0" v-model="step">
                    <v-stepper-header class="elevation-0">
                        <v-stepper-step :complete="step > 1" step="1"></v-stepper-step>
                        <v-divider/>
                        <v-stepper-step :complete="step > 2" step="2"></v-stepper-step>
                    </v-stepper-header>
                    <div
                        class="subheading font-weight-light pl-4"
                    >{{['Import', 'Set Password'][step-1]}}</div>
                    <v-stepper-items>
                        <v-stepper-content step="1">
                            <ContentForm v-if="show" ref="pk" v-model="content"></ContentForm>
                        </v-stepper-content>
                        <v-stepper-content step="2">
                            <NameAndPass v-if="show" v-model="nameAndPass"></NameAndPass>
                            <v-checkbox
                                v-if="addressExist"
                                label="The wallet already existed, Please check the box to agree overwriting an old wallet."
                                v-model="overWrite"
                            ></v-checkbox>
                        </v-stepper-content>
                    </v-stepper-items>
                </v-stepper>
            </v-card-text>
            <v-card-actions>
                <v-btn @click="preMove" flat>{{ BackBtnStatus.text }}</v-btn>
                <v-spacer/>
                <v-btn
                    @click="nextMove"
                    :disabled="preBtnStatus.disable"
                    flat
                    color="primary"
                >{{ preBtnStatus.text }}</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>
<script lang="ts">
import { Vue, Component, Watch } from 'vue-property-decorator'
import ContentForm from './WalletContentForm.vue'
import NameAndPass from './NameAndPass.vue'
import { cry } from 'thor-devkit'

@Component({
    components: {
        ContentForm,
        NameAndPass
    }
})
export default class ImportWalletDialog extends Vue {
    name = 'ImportWalletDialog'
    addressExist = false
    show = false
    overWrite = false
    step = 1
    pk?: Buffer
    nameAndPass: NameAndPass.Value = { name: '', password: '', valid: false }
    content: WalletContentForm.Value = {
        type: 0,
        pwd: '',
        content: '',
        valid: false
    }

    get BackBtnStatus() {
        return {
            text: this.step === 1 ? 'Abort' : 'Back'
        }
    }

    get preBtnStatus() {
        let disable = false
        if (this.step === 1) {
            disable = !this.content.valid
        } else {
            if (this.addressExist) {
                disable = !this.overWrite || !this.nameAndPass.valid
            } else {
                disable = !this.nameAndPass.valid
            }
        }
        return {
            text: this.step === 1 ? 'Next' : 'import',
            disable: disable
        }
    }
    reset() {
        const form = this.$refs.pk as ContentForm
        this.addressExist = false
        this.nameAndPass.name = ''
        this.nameAndPass.password = ''
        this.nameAndPass.valid = false
        this.step = 1
        form.reset()
    }
    preMove() {
        if (this.step === 2) {
            this.step--
            return
        } else {
            this.show = false
            this.reset()
        }
    }

    async nextMove() {
        if (this.step === 1) {
            const form = this.$refs.pk as ContentForm
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
            this.step++
        } else {
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
                    await BDB.wallets.where('address').equals(entity.address).modify({keystore: entity.keystore, name: entity.name})
                } else {
                    await BDB.wallets.add(entity)
                }

                this.show = false
                this.reset()
            } catch (err) {
                console.log(err)
            }
        }
    }
}
</script>

