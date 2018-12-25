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
import { TxSigningDialog } from '@/renderer/components'
import { Entities } from '@/renderer/database'
import { State } from 'vuex-class'
import { normalizeMsg, normalizeTxSignOptions, describe } from './utils'

declare module 'electron' {
    interface App {
        vendor: {
            [windowId: number]: SignTx
        }
    }
}

@Component
export default class Vendor extends Vue {
    snackbar = false
    snackbarText = ''
    dialogOpened = false
    @State wallets!: Entities.Wallet[]

    mounted() {
        remote.app.EXTENSION.inject(
            remote.getCurrentWebContents().id,
            `vendor.${remote.getCurrentWindow().id}`, {
                signTx: (
                    contentsId: number,
                    message: Connex.Vendor.SigningService.TxMessage,
                    options: SignTx.Options,
                    referer: { url: string, title: string },
                    callback: (err?: Error, result?: Connex.Vendor.SigningService.TxResponse) => void
                ) => {
                    this.signTx(contentsId, message, options, referer)
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
                }
            })
    }

    async signTx(
        contentsId: number,
        message: Connex.Vendor.SigningService.TxMessage,
        options: SignTx.Options,
        referer: { url: string, title: string }) {

        if (this.dialogOpened) { throw new Rejected('request is in progress') }
        if (this.wallets.length === 0) { throw new Rejected('no wallet available') }
        const callingWebContents = remote.webContents.fromId(contentsId)
        // either focused or dev tools opened
        if (!remote.webContents.fromId(contentsId).isFocused() &&
            !callingWebContents.isDevToolsOpened()) {
            throw new Rejected('not in focus')
        }
        try {
            message = normalizeMsg(message)
            options = normalizeTxSignOptions(options)
        } catch (err) {
            throw new BadMessage(err.message)
        }


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
                txComment: options.comment || describe(message)
            })
            await BDB.txRecords.add({
                id: result.txId,
                insertTime: Date.now(),
                signer: result.signer,
                confirmed: 0,
                raw: result.rawTx,
                referer: { ...referer! },
                summary: [options.comment!, message.map(c => c.comment!)],
                link: options.link || '',
                estimatedFee: result.estimatedFee,
                receipt: null
            })
            TXER.send(result.txId, result.rawTx)

            return {
                txId: result.txId,
                signer: result.signer
            }
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

class BadMessage extends Error {
    constructor(msg: string) {
        super(msg)
        this.name = BadMessage.name
    }
}
</script>
