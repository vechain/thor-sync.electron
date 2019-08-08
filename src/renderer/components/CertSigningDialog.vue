<template>
    <DialogEx
        persistent
        content-class="sign-dialog"
        v-model="opened"
        @action:ok="goNext"
        @action:cancel="decline"
        width="700px"
        height="490px"
        transition="sign-dialog-transition"
    >
        <v-card class="bg">
            <v-layout column style="height:445px;">
                <v-layout
                    column
                    justify-center
                    style="overflow: auto;
                        background-color:rgba(0,0,0,0.1);
                        position: absolute;
                        height: 315px;
                        width: 100%;
                        top: 130px"
                >
                    <template v-if="step ===1">
                        <div>
                            <v-layout column>
                                <v-layout class="py-2 px-3" align-center style="flex:0 0 auto;">
                                    <div class="subheading text-truncate mr-3">Certificate</div>
                                    <b class="label primary text-uppercase">{{arg.message.purpose}}</b>
                                </v-layout>
                            </v-layout>
                        </div>
                        <v-layout column>
                            <textarea
                                style="220px"
                                :value="arg.message.payload.content"
                                readonly
                                class="payload pa-2 serif"
                            />
                        </v-layout>
                    </template>
                    <template v-else-if="step === 2">
                        <v-card-text
                            style="width: 500px; margin: auto"
                            class="mt-4"
                            v-show="!privateKey"
                        >
                            <p
                                style="text-align: center; font-size: 16px;margin-bottom: 50px"
                            >Please input your wallet's password to sign the certificate</p>
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
                        <v-card-text v-show="!!privateKey" class="text-xs-center mt-4 subheading">
                            <p class="title">Please sign the certificate</p>
                            <v-icon class="mr-2 display-2">mdi-lock-open</v-icon>
                            <p class="grey--text text--darken-1">The wallet is unlocked</p>
                        </v-card-text>
                        <div style="position:absolute;left:0;bottom:0; width: 100%">
                            <v-progress-linear
                                v-show="signing"
                                class="ma-0"
                                height="2"
                                color="success"
                                indeterminate
                            />
                        </div>
                    </template>
                </v-layout>
                <div class="signing-content-top" style="height: 130px">
                    <v-layout row>
                        <v-layout column align-content-center>
                            <v-card-text style="width: 270px; padding: 10px; margin: auto">
                                <WalletSeeker
                                    full-size
                                    :wallets="arg.wallets"
                                    v-model="arg.selectedWallet"
                                    :disabled="signing || step === 2"
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
                            <v-card-text style="width: 280px">
                                <div
                                    class="lighten-5"
                                >Your signature is being requested. Please review the content before you signed. Always make sure you trust the sites you interact with.</div>
                            </v-card-text>
                        </v-layout>
                    </v-layout>
                </div>
                <div class="signing-content-bottom"></div>
            </v-layout>

            <v-card-actions class="signing-footer" style="flex: 0 0 auto;">
                <v-btn :disabled="signing" small flat @click="decline">Decline</v-btn>
                <v-spacer />
                <template v-if="step === 2">
                    <v-btn small flat dark :disabled="signing" class="secondary" @click="back">Back</v-btn>
                    <v-btn
                        small
                        flat
                        dark
                        :disabled="signing"
                        class="green darken-1"
                        @click="sign"
                    >Sign</v-btn>
                </template>
                <v-btn
                    small
                    v-if="step === 1"
                    flat
                    dark
                    :disabled="signing"
                    class="green darken-1"
                    @click="step++"
                >Next</v-btn>
            </v-card-actions>
        </v-card>
    </DialogEx>
</template>
<script lang="ts">
import { Vue, Component, Mixins } from 'vue-property-decorator'
import DialogHelper from '@/renderer/mixins/dialog-helper'
import { Certificate, cry } from 'thor-devkit'
import { setUnlocked, getUnlocked } from '../unlocked'

type Arg = {
    message: Connex.Vendor.CertMessage
    wallets: entities.Wallet[]
    selectedWallet: number
    domain: string
}

@Component
export default class CertSigningDialog extends Mixins(class extends DialogHelper<Arg, Connex.Vendor.CertResponse>{ }) {
    opened = false
    password = ''
    passwordError = ''
    signing = false
    step = 1
    get wallet() { return this.arg.wallets[this.arg.selectedWallet] }
    keepUnlocked = false
    get privateKey() { return getUnlocked(this.wallet.id!) }

    mounted() {
        this.opened = true
    }
    get passwordInputElem() {
        return (this.$refs.passwordElem as Vue).$el.querySelector('input')!
    }

    async goNext() {
        if (this.step === 1) {
            this.step++
        } else {
            await this.sign()
        }
    }
    async sign() {
        if (this.signing) {
            return
        }
        if (!this.privateKey && !this.password) {
            this.passwordError = 'Input password here'
            return
        }
        try {
            this.signing = true
            this.passwordError = ''

            const wallet = this.wallet
            const annex = {
                domain: this.arg.domain,
                timestamp: connex.thor.status.head.timestamp,
                signer: wallet.address!
            }

            let privateKey
            if (this.privateKey) {
                privateKey = this.privateKey
                setUnlocked(this.wallet.id!, privateKey)
            } else {
                privateKey = await cry.Keystore.decrypt(this.wallet.keystore, this.password)
                if (this.keepUnlocked) {
                    setUnlocked(this.wallet.id!, privateKey)
                }
            }

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
            LOG.warn('CertSigningDialog:', 'sign error', err)
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

    back() {
        this.step--
        this.keepUnlocked = false
        this.password = ''
    }

    decline() {
        if (this.signing) {
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
.payload {
    resize: none;
    height: 220px;
    border-radius: 2px;
    outline: none;
    background-color: #fff;
}
.theme--dark .payload {
    background-color: #383838;
}
.theme--dark .bg {
    background-color: #303030;
}

.signing-content-top {
    box-shadow: 0px 3px 6px 1px rgba(0, 0, 0, 0.15);
    height: 130px;
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
