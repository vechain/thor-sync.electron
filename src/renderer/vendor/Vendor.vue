<template>
    <div style="position: absolute;left:0;top:0;right:0">
        <v-snackbar v-model="snackbar" :timeout="6000" top right absolute>
            {{snackbarText}}
            <v-btn flat @click="snackbar = false">Close</v-btn>
        </v-snackbar>
    </div>
</template>
<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { remote } from 'electron'
import { TxSigningDialog, CertSigningDialog } from '@/renderer/components'
import { State } from 'vuex-class'
import * as UrlUtils from '@/common/url-utils'

@Component
export default class Vendor extends Vue {
    snackbar = false
    snackbarText = ''
    dialogOpened = false
    @State wallets!: entities.Wallet[]

    mounted() {
        remote.app.EXTENSION.inject(
            remote.getCurrentWebContents().id,
            `vendor.${remote.getCurrentWindow().id}`, {
                signTx: (
                    contentsId: number,
                    message: Connex.Vendor.SigningService.TxMessage,
                    options: VendorInterface.SignTxOptions,
                    referer: Referer,
                    callback: (err?: Error, result?: Connex.Vendor.SigningService.TxResponse) => void
                ) => {
                    this.precheck(contentsId)
                        .then(() => this.signTx(message, options, referer))
                        .then(result => {
                            setTimeout(() => {
                                this.snackbarText = 'Transaction signed and enqueued'
                                this.snackbar = true
                            }, 500)
                            callback(undefined, result)
                        }).catch(err => {
                            console.warn(err)
                            callback({ name: err.name, message: err.message })
                        })
                },
                signCert: (
                    contentsId: number,
                    message: Connex.Vendor.SigningService.CertMessage,
                    options: VendorInterface.SignCertOptions,
                    referer: Referer,
                    callback: (err?: Error, result?: Connex.Vendor.SigningService.CertResponse) => void
                ) => {
                    this.precheck(contentsId)
                        .then(() => this.signCert(message, options, referer))
                        .then(result => {
                            setTimeout(() => {
                                this.snackbarText = 'Certificate signed'
                                this.snackbar = true
                            }, 500)
                            callback(undefined, result)
                        }).catch(err => {
                            console.warn(err)
                            callback({ name: err.name, message: err.message })
                        })
                }
            })
    }

    async precheck(contentsId: number) {
        if (this.dialogOpened) { throw new Rejected('request is in progress') }
        if (this.wallets.length === 0) { throw new Rejected('no wallet available') }
        const callingWebContents = remote.webContents.fromId(contentsId)
        // either focused or dev tools opened
        if (!remote.webContents.fromId(contentsId).isFocused() &&
            !callingWebContents.isDevToolsOpened()) {
            throw new Rejected('not in focus')
        }
    }

    async signTx(
        message: Connex.Vendor.SigningService.TxMessage,
        options: VendorInterface.SignTxOptions,
        referer: Referer): Promise<Connex.Vendor.SigningService.TxResponse> {

        let walletIndex = 0
        if (options.signer) {
            walletIndex = this.wallets.findIndex(w => w.address!.toLowerCase() === options.signer!.toLowerCase())
            if (walletIndex < 0) {
                throw new Rejected('required signer unavailable')
            }
        }

        try {
            this.dialogOpened = true
            const result = await this.$dialog(TxSigningDialog, {
                message,
                // enforce using wallet
                wallets: options.signer ? [this.wallets[walletIndex]] : this.wallets.slice(),
                selectedWallet: options.signer ? 0 : walletIndex,
                suggestedGas: options.gas || 0,
                txComment: options.comment || ''
            })

            await BDB.activities.add({
                type: 'tx',
                createdTime: Date.now(),
                referer,
                closed: 0,
                data: {
                    id: result.txid,
                    message: message,
                    timestamp: result.timestamp,
                    comment: options.comment || '',
                    signer: result.signer,
                    estimatedFee: result.estimatedFee,
                    link: options.link || '',
                    raw: result.rawTx,
                    receipt: null
                }
            })
            TXER.send(result.txid, result.rawTx)

            return {
                txid: result.txid,
                signer: result.signer
            }
        } finally {
            this.dialogOpened = false
        }
    }

    async signCert(
        message: Connex.Vendor.SigningService.CertMessage,
        options: VendorInterface.SignCertOptions,
        referer: Referer
    ) {

        let walletIndex = 0
        if (options.signer) {
            walletIndex = this.wallets.findIndex(w => w.address!.toLowerCase() === options.signer!.toLowerCase())
            if (walletIndex < 0) {
                throw new Rejected('required signer unavailable')
            }
        }

        try {
            this.dialogOpened = true
            const result = await this.$dialog(CertSigningDialog, {
                message,
                // enforce using wallet
                wallets: options.signer ? [this.wallets[walletIndex]] : this.wallets.slice(),
                selectedWallet: options.signer ? 0 : walletIndex,
                domain: UrlUtils.hostnameOf(referer.url)
            })

            await BDB.activities.add({
                type: 'cert',
                createdTime: Date.now(),
                referer,
                closed: 1,
                data: {
                    message: message,
                    timestamp: result.annex.timestamp,
                    signer: result.annex.signer,
                    domain: result.annex.domain,
                    signature: result.signature
                }
            })
            return result
        } finally {
            this.dialogOpened = false
        }
    }
}


class Rejected extends Error {
    constructor(msg: string) {
        super(msg)
        this.name = Rejected.name
    }
}
</script>
