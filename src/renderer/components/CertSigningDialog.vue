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
            <v-layout row style="height:500px;">
                <v-layout
                    column
                    style="width:400px;flex:0 0 auto;background-color:rgba(0,0,0,0.1);"
                    pa-1
                >
                    <v-layout class="py-2 px-3" align-center style="flex:0 0 auto;">
                        <div class="subheading text-truncate">Certificate</div>
                        <v-spacer/>
                        <b class="label primary text-uppercase">{{arg.message.purpose}}</b>
                    </v-layout>
                    <textarea
                        :value="arg.message.payload.content"
                        readonly
                        class="payload pa-2 white serif"
                    />
                </v-layout>
                <v-layout column style="width:300px">
                    <v-card-text>
                        <WalletSeeker
                            :wallets="arg.wallets"
                            v-model="arg.selectedWallet"
                            :disabled="signing"
                        />
                    </v-card-text>
                    <v-card-text>
                        <Tip
                            type="warning lighten-5"
                        >Your signature is being requested. Please review the content before you signed. Always make sure you trust the sites you interact with.</Tip>
                    </v-card-text>
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
import { Vue, Component, Mixins } from 'vue-property-decorator'
import DialogHelper from '@/renderer/mixins/dialog-helper'
import { Entities } from '@/renderer/database'
import { Certificate, cry } from 'thor-devkit'

type Arg = {
    message: Connex.Vendor.SigningService.CertMessage
    wallets: Entities.Wallet[]
    selectedWallet: number
    domain: string
}

@Component
export default class CertSigningDialog extends Mixins(class extends DialogHelper<Arg, Connex.Vendor.SigningService.CertResponse>{ }) {
    opened = false
    password = ''
    passwordError = ''
    signing = false
    readonly passwordRules = [(v: string) => !!v || 'Input password here']

    get readyToSign() {
        return !this.signing &&
            this.passwordRules.every(r => r(this.password) === true)
    }
    get wallet() { return this.arg.wallets[this.arg.selectedWallet] }

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

            const keystore = this.wallet.keystore!
            const annex = {

                domain: this.arg.domain,
                timestamp: connex.thor.status.head.timestamp,
                signer: keystore.address!

            }

            const privateKey = await cry.Keystore.decrypt(this.wallet.keystore!, this.password)
            const unsigned = Certificate.encode({
                ...this.arg.message,
                ...annex
            })

            const signature = '0x' + cry.secp256k1.sign(cry.blake2b256(unsigned), privateKey).toString('hex')

            this.opened = false
            this.$resolve({
                annex,
                signature
            })
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
<style scoped>
.payload {
    resize: none;
    height: 100%;
    border-radius: 2px;
    outline: none;
    box-shadow: 0px 0px 6px 0.5px rgba(0, 0, 0, 0.05) inset,
        0px 0px 0px 0.5px rgba(0, 0, 0, 0.05);
}
</style>




