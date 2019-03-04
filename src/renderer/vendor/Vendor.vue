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

    @State wallets!: entities.Wallet[]

    mounted() {
        ipcServe('vendor', async (fromWebContentsId, methodName, arg) => {
            try {
                await this.precheck(fromWebContentsId)
                if (methodName === 'sign-tx') {
                    return await this.signTx(arg)
                } else if (methodName === 'sign-cert') {
                    return await this.signCert(arg)
                }
                throw new Error(`unexpected method '${methodName}'`)
            } catch (err) {
                // it's important to transform error into plain object,
                // since electron's ipc will json/unjson arguments
                throw { name: err.name, message: err.message }
            }
        })
    }

    async precheck(contentsId: number) {
        if (this.dialogOpened) { throw new Rejected('request is in progress') }
        if (!this.wallets.length) {
            this.snack.open = true
            this.snack.message = 'You have no wallet yet'
            this.snack.actionName = 'Create Now'
            this.snack.action = () => {
                this.snack.open = false
                BUS.$emit('open-tab', { href: 'sync://wallets', mode: 'inplace-builtin' })
            }
            throw new Rejected('no wallet available')
        }
        const callingWebContents = remote.webContents.fromId(contentsId)
        // either focused or dev tools opened
        if (!remote.webContents.fromId(contentsId).isFocused() &&
            !callingWebContents.isDevToolsOpened()) {
            throw new Rejected('not in focus')
        }
    }

    async signTx(arg: SignTxArg): Promise<Connex.Vendor.SigningService.TxResponse> {

        let walletIndex = 0
        if (arg.options.signer) {
            walletIndex = this.wallets.findIndex(w => w.address!.toLowerCase() === arg.options.signer!.toLowerCase())
            if (walletIndex < 0) {
                throw new Rejected('required signer unavailable')
            }
        }

        try {
            this.dialogOpened = true
            const result = await this.$dialog(TxSigningDialog, {
                message: arg.message,
                // enforce using wallet
                wallets: arg.options.signer ? [this.wallets[walletIndex]] : this.wallets.slice(),
                selectedWallet: arg.options.signer ? 0 : walletIndex,
                suggestedGas: arg.options.gas || 0,
                txComment: arg.options.comment || ''
            })

            await BDB.activities.add({
                type: 'tx',
                createdTime: Date.now(),
                referer: arg.referer,
                closed: 0,
                data: {
                    id: result.txid,
                    message: arg.message,
                    timestamp: result.timestamp,
                    comment: arg.options.comment || '',
                    signer: result.signer,
                    estimatedFee: result.estimatedFee,
                    link: arg.options.link || '',
                    raw: result.rawTx,
                    receipt: null
                }
            })
            CLIENT.txer.send(result.txid, result.rawTx)
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

    async signCert(arg: SignCertArg) {

        let walletIndex = 0
        if (arg.options.signer) {
            walletIndex = this.wallets.findIndex(w => w.address!.toLowerCase() === arg.options.signer!.toLowerCase())
            if (walletIndex < 0) {
                throw new Rejected('required signer unavailable')
            }
        }

        try {
            this.dialogOpened = true
            const result = await this.$dialog(CertSigningDialog, {
                message: arg.message,
                // enforce using wallet
                wallets: arg.options.signer ? [this.wallets[walletIndex]] : this.wallets.slice(),
                selectedWallet: arg.options.signer ? 0 : walletIndex,
                domain: UrlUtils.hostnameOf(arg.referer.url)
            })

            const id = '0x' + cry.blake2b256(Certificate.encode({
                ...arg.message,
                ...result.annex,
                signature: result.signature
            })).toString('hex')

            await BDB.activities.add({
                type: 'cert',
                createdTime: Date.now(),
                referer: arg.referer,
                closed: 1,
                data: {
                    id,
                    message: arg.message,
                    timestamp: result.annex.timestamp,
                    signer: result.annex.signer,
                    domain: result.annex.domain,
                    signature: result.signature,
                    link: arg.options.link || ''
                }
            })


            new Notification('Cert Signed', {
                body: `${result.annex.domain}: ${arg.message.purpose}`
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
