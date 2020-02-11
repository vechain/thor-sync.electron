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
            <v-layout column style="height:495px;">
                <v-layout
                    column
                    justify-center
                    style="overflow: auto;
                        background-color:rgba(0,0,0,0.1);
                        position: absolute;
                        height: 315px;
                        width: 100%;
                        top: 180px"
                >
                <Tip class="ma-1" v-if="!isLocal && connected" type="info">Please double check the transaction and confirm on your device</Tip>
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
                        <template v-if="isLocal">
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
                            <v-card-text
                                v-show="!!privateKey"
                                class="text-xs-center mt-4 subheading"
                            >
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
                        <template v-else>
                            <div
                                v-show="!connected  && !ledgerError"
                                style="width: 500px; margin: auto"
                                class="text-md-center pt-1"
                            >
                                <h3>Please connecting to device</h3>
                                <LedgerStatus
                                    ref="ledgerStatus"
                                    :publicKey="currentGroup.key"
                                    @deviceInfo="onConnectedLedger"
                                    @timeout="onLedgerTimeout"
                                    style="background: transparent"
                                />
                            </div>
                            <div style="width: 700px; margin: auto"
                                class="text-sm-center mt-5" v-show="connected && !ledgerError">
                                <h3 class="title">Confirm and sign the message</h3>
                                <p class="pt-4">
                                    <span  style="font-family: 'Roboto Mono', monospace" class="display-2 d-inline-block px-2 mx-2" :class="{'elevation-1': i!== 4}" v-for="(e, i) in unsignedHexStr" :key="i">
                                        {{e}}
                                    </span>
                                </p>
                                <span class="grey--text text--darken-2">Waiting for the confirmation...</span>
                            </div>
                            <div class="text-md-center pt-1" style="width: 500px; margin: auto" v-if="!!ledgerError">
                                    <v-icon color="error" class="display-3">mdi-alert-circle-outline</v-icon>
                                    <p class="error--text">{{ledgerError.message}}</p>
                                </div>
                        </template>
                    </template>
                </v-layout>
                <div class="signing-content-top" style="height: 180px">
                    <v-menu :disabled="step === 2 || groups.length === 1" offset-y>
                        <template>
                            <v-btn
                                :disabled="step === 2 || groups.length === 1"
                                :flat="!(step === 2 || groups.length === 1)"
                                small
                                slot="activator"
                            >
                                {{currentGroup.name}}
                                <v-icon right>mdi-menu-down</v-icon>
                            </v-btn>
                        </template>
                        <v-list>
                            <v-list-tile v-for="(item, index) in groups" :key="index">
                                <v-list-tile-content>
                                    <v-btn small flat @click="onGroupSelect(item)">{{ item.name }}</v-btn>
                                </v-list-tile-content>
                            </v-list-tile>
                        </v-list>
                    </v-menu>
                    <v-layout row>
                        <v-layout column align-content-center>
                            <v-card-text style="width: 270px; padding: 10px; margin: auto">
                                <WalletSeeker
                                    full-size
                                    :wallets="wallets"
                                    v-model="seekIndex"
                                    :noseek="step===2 || !!arg.selectedWallet"
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
                <v-btn
                    v-show="step === 2"
                    small
                    flat
                    dark
                    :disabled="signing"
                    class="secondary"
                    @click="back"
                >Back</v-btn>
                <v-btn
                    v-if="isLocal"
                    v-show="step === 2"
                    small
                    flat
                    dark
                    :disabled="signing"
                    class="green darken-1"
                    @click="sign"
                >Sign</v-btn>
                <v-btn
                    v-show="step === 1"
                    small
                    flat
                    dark
                    :disabled="signing"
                    class="green darken-1"
                    @click="goNext"
                >Next</v-btn>
            </v-card-actions>
        </v-card>
    </DialogEx>
</template>
<script lang="ts">
import { Vue, Component, Mixins, Watch } from 'vue-property-decorator'
import DialogHelper from '@/renderer/mixins/dialog-helper'
import { Certificate, cry } from 'thor-devkit'
import { setUnlocked, getUnlocked } from '../unlocked'
import ledger from '@/common/ledger'
import * as Keystore from '@/common/keystore'

type walletList = {
    sectionName: string
    key?: string
    list: entities.Wallet[] | { name: string; address: string }[]
}[]
type Arg = {
    message: Connex.Vendor.CertMessage
    wallets: walletList
    selectedWallet: string
    domain: string
}

@Component
export default class CertSigningDialog extends Mixins(
    class extends DialogHelper<Arg, Connex.Vendor.CertResponse> {}
) {
    opened = false
    password = ''
    passwordError = ''
    signing = false
    ledgerError: any = null
    step = 1
    connected = false
    seekIndex = 0
    unsignedHex: String = ''
    currentGroup: {
        name: string
        key: string
    } = {
        name: '',
        key: ''
    }

    keepUnlocked = false
    get privateKey() {
        const _wallet = this.wallet as entities.Wallet
        return getUnlocked(_wallet.id! || -1)
    }
    get groups() {
        return this.arg.wallets.map(item => {
            return {
                name: item.sectionName,
                key: item.key
            }
        })
    }
    get lastSigner() {
        return this.$store.getters.lastSigner
    }
    get isLocal() {
        return this.currentGroup.key === 'local'
    }
    get wallets(): entities.Wallet[] | { name: string, address: string }[] {
        const wallets = this.arg.wallets.find(item => { return item.key === this.currentGroup!.key })
        if (wallets) {
            return wallets.list
        } else {
            return []
        }
    }
    get wallet(): entities.Wallet | { name: string; address: string } | null {
        if (this.wallets.length) {
            return this.wallets[this.seekIndex] || null
        } else {
            return null
        }
    }

    get unsignedHexStr() {
        return this.unsignedHex
            ? this.unsignedHex.toUpperCase().slice(0, 4) + '…' + this.unsignedHex.toUpperCase().slice(this.unsignedHex.toUpperCase().length - 4) : ''
    }
    onConnectedLedger(r: any) {
        if (r.publicKey === this.currentGroup.key) {
            setTimeout(() => {
                this.connected = true
                this.ledgerSign()
            }, 500)
        } else {
            this.signing = false
        }
    }

    getDefaultGroup() {
        if (this.arg.wallets.length > 1) {
            const group = this.arg.wallets.find(item => {
                const temp = item.list.find(wallet => {
                    return wallet.address === this.lastSigner
                })
                return !!temp
            })
            if (group) {
                return {
                    key: group.key!,
                    name: group.sectionName
                }
            }
        }
        return {
            key: this.arg.wallets[0].key!,
            name: this.arg.wallets[0].sectionName
        }
    }

    onLedgerTimeout() {
        this.signing = false
        this.ledgerError = new Error('Unable to connect your devce, please retry!')
    }
    onGroupSelect(item: { name: string; key: string }) {
        this.currentGroup = item
    }
    @Watch('currentGroup')
    setWalletThings() {
        const i = this.wallets.findIndex(w => { return w.address === (this.arg.selectedWallet || this.lastSigner) })
        this.seekIndex = i < 0 ? 0 : i
    }
    mounted() {
        this.setWalletThings()
        this.currentGroup = this.getDefaultGroup()
        this.opened = true
    }
    get passwordInputElem() {
        return (this.$refs.passwordElem as Vue).$el.querySelector('input')!
    }

    async goNext() {
        if (this.step === 1) {
            this.step++
            if (!this.isLocal) {
                this.signing = true
            }
        } else {
            await this.sign()
        }
    }

    async sign() {
        if (this.isLocal) {
            await this.localSign()
        } else {
            await this.ledgerSign()
        }
    }
    async ledgerSign() {
        try {
            this.signing = true
            const wallet = this.wallet as entities.Wallet
            const annex = {
                domain: this.arg.domain,
                timestamp: connex.thor.status.head.timestamp,
                signer: wallet!.address!
            }
            const unsigned = Certificate.encode({ ...this.arg.message, ...annex })
            this.unsignedHex = cry.blake2b256(unsigned).toString('hex')
            const signature = await ledger.signCert(this.seekIndex, Buffer.from(unsigned))
            this.opened = false
            this.$resolve({
                annex,
                signature: '0x' + signature.toString('hex')
            })
        } catch (error) {
            console.log(error)
            LOG.log(error.message)
            // user decline
            if (error.statusText === 'CONDITIONS_OF_USE_NOT_SATISFIED' || error.name === 'DisconnectedDevice') {
                this.signing = false
                this.decline()
            } else {
                this.ledgerError = error
            }
        } finally {
            this.signing = false
        }
    }
    async localSign() {
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

            const wallet = this.wallet as entities.Wallet
            const annex = {
                domain: this.arg.domain,
                timestamp: connex.thor.status.head.timestamp,
                signer: wallet!.address!
            }

            let privateKey
            if (this.privateKey) {
                privateKey = this.privateKey
                setUnlocked(wallet.id!, privateKey)
            } else {
                privateKey = await Keystore.decrypt(wallet.keystore, this.password)
                if (this.keepUnlocked) {
                    setUnlocked(wallet.id!, privateKey)
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
        this.signing = false
        this.connected = false
        this.ledgerError = null
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
