<template>
    <div>
        <v-snackbar v-model="snack.open" top :timeout="60000" color="info" style="top: 72px;">
            {{snack.message}}
            <v-btn flat small dark @click="snack.action">{{snack.actionName}}</v-btn>
            <v-btn dark icon @click="snack.open=false">
                <v-icon small>close</v-icon>
            </v-btn>
        </v-snackbar>
    </div>
</template>
<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { remote } from 'electron'
import { TxSigningDialog, CertSigningDialog } from '@/renderer/components'
import { State } from 'vuex-class'
import * as UrlUtils from '@/common/url-utils'
import { ipcServe } from '../ipc'
import { Certificate, cry } from 'thor-devkit'

@Component
export default class Vendor extends Vue {
    dialogOpened = false
    snack = {
        open: false,
        message: '',
        actionName: '',
        action: () => { },
    }
    get lastSigner() {
        return this.$store.getters.lastSigner
    }

    get lastWalletIndex() {
        const i = this.wallets.findIndex(w => w.address!.toLowerCase() === this.lastSigner)
        return i < 0 ? 0 : i
    }

    @State wallets!: entities.Wallet[]

    mounted() {
        window.VENDOR = {
            signTx: async (msg, options, caller) => {
                await this.precheck(caller.webContentsId)
                return this.signTx(msg, options, caller.referer)
            },
            signCert: async (msg, options, caller) => {
                await this.precheck(caller.webContentsId)
                return this.signCert(msg, options, caller.referer)
            },
            isAddressOwned: addr => {
                return Promise.resolve(!!this.wallets.find(w => w.address === addr))
            }
        }
    }

    async precheck(contentsId: number) {
        if (this.dialogOpened) { throw new Error('request is in progress') }
        if (!this.wallets.length) {
            this.snack.open = true
            this.snack.message = 'You have no wallet yet'
            this.snack.actionName = 'Create Now'
            this.snack.action = () => {
                this.snack.open = false
                BUS.$emit('open-tab', { href: 'sync://wallets', mode: 'inplace-builtin' })
            }
            throw new Error('no wallet available')
        }
        const callingWebContents = remote.webContents.fromId(contentsId)
        // either focused or dev tools opened
        if (!remote.webContents.fromId(contentsId).isFocused() &&
            !callingWebContents.isDevToolsOpened()) {
            throw new Error('not in focus')
        }
    }

    async signTx(arg: Connex.Driver.SignTxArg, option: Connex.Driver.SignTxOption, referer: Referer): Promise<Connex.Vendor.TxResponse> {

        let enforcedWallet
        if (option.signer) {
            enforcedWallet = this.wallets.find(w => w.address!.toLowerCase() === option.signer!.toLowerCase())
            if (!enforcedWallet) {
                throw new Error('required signer unavailable')
            }
        }

        try {
            this.dialogOpened = true
            const result = await this.$dialog(TxSigningDialog, {
                message: arg,
                // enforce using wallet
                wallets: enforcedWallet ? [enforcedWallet] : this.wallets.slice(),
                selectedWallet: enforcedWallet ? 0 : this.lastWalletIndex,
                suggestedGas: option.gas || 0,
                txComment: option.comment || '',
                dependsOn: option.dependsOn || null,
                delegationHandler: option.delegationHandler
            })

            PREFS.store.put({
                key: connex.thor.genesis.id + '-lastSigner',
                value: result.signer.toLowerCase()
            })

            await BDB.activities.add({
                type: 'tx',
                createdTime: Date.now(),
                referer,
                closed: 0,
                data: {
                    id: result.txid,
                    message: arg,
                    timestamp: result.timestamp,
                    comment: option.comment || '',
                    signer: result.signer,
                    estimatedFee: result.estimatedFee,
                    link: option.link || '',
                    raw: result.rawTx,
                    receipt: null
                }
            })
            remote.app.EXTENSION.txer.enqueue(result.txid, result.rawTx, NODE_CONFIG.url)
            new Notification('Tx Signed', {
                body: result.txid
            }).onclick = () => {
                BUS.$emit('open-tab', { href: `https://insight.vecha.in/#/txs/${result.txid}` })
            }

            return {
                txid: result.txid,
                signer: result.signer
            }
        } finally {
            this.dialogOpened = false
        }
    }

    async signCert(arg: Connex.Driver.SignCertArg, option: Connex.Driver.SignCertOption, referer: Referer) {

        let enforcedWallet
        if (option.signer) {
            enforcedWallet = this.wallets.find(w => w.address!.toLowerCase() === option.signer!.toLowerCase())
            if (!enforcedWallet) {
                throw new Error('required signer unavailable')
            }
        }

        try {
            this.dialogOpened = true
            const result = await this.$dialog(CertSigningDialog, {
                message: arg,
                // enforce using wallet
                wallets: enforcedWallet ? [enforcedWallet] : this.wallets.slice(),
                selectedWallet: enforcedWallet ? 0 : this.lastWalletIndex,
                domain: UrlUtils.hostnameOf(referer.url)
            })

            PREFS.store.put({
                key: connex.thor.genesis.id + '-lastSigner',
                value: result.annex.signer.toLowerCase()
            })

            const id = '0x' + cry.blake2b256(Certificate.encode({
                ...arg,
                ...result.annex,
                signature: result.signature
            })).toString('hex')

            await BDB.activities.add({
                type: 'cert',
                createdTime: Date.now(),
                referer,
                closed: 1,
                data: {
                    id,
                    message: arg,
                    timestamp: result.annex.timestamp,
                    signer: result.annex.signer,
                    domain: result.annex.domain,
                    signature: result.signature,
                    link: option.link || ''
                }
            })


            new Notification('Cert Signed', {
                body: `${result.annex.domain}: ${arg.purpose}`
            })
            return result
        } finally {
            this.dialogOpened = false
        }
    }
}

</script>
