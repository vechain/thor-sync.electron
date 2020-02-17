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
import { State, Getter } from 'vuex-class'
import * as UrlUtils from '@/common/url-utils'
import { ipcServe } from '../ipc'
import { Certificate, cry } from 'thor-devkit'
import { getExploreUrl } from '@/explorer-configs'

@Component
export default class Vendor extends Vue {
    dialogOpened = false
    snack = {
        open: false,
        message: '',
        actionName: '',
        action: () => { },
    }

    get ledgerAccountList() {
        let result: string[] = []
        this.ledgerAccounts.forEach(item => {
            result = [...result, ...item.accounts]
        })
        return result
    }

    @Getter ledgerAccounts!: (entities.LedgerDevice & { accounts: string[] })[]
    @State wallets!: entities.Wallet[]

    isAddressOwned(addr: string) {
        const temp = addr.toLowerCase()
        return !!this.wallets.find(w => w.address.toLowerCase() === temp)
            || !!this.ledgerAccountList!.find(w => w.toLowerCase() === temp)
    }

    getArgWallets(addr?: string) {
        if (addr) {
            let local = this.wallets.find(item => {
                return item.address.toLowerCase() === addr
            })
            if (!!local) {
                return [
                    {
                        sectionName: 'Local',
                        key: 'local',
                        list: this.wallets.slice()
                    },
                ]
            } else {
                let ledger = this.ledgerAccounts.find(item => {
                    return item.accounts.indexOf(addr) >= 0
                })
                // let index = ledger!.accounts.findIndex(item => { return item === addr })
                if (ledger) {
                    return [
                        {
                            sectionName: ledger!.name,
                            key: ledger!.publicKey,
                            list: ledger!.accounts.map((item, index) => {
                                return {
                                    name: Vue.filter('ledgerName')(ledger!.name, index),
                                    address: item
                                }
                            })
                        }
                    ]
                } else {
                    return []
                }
            }
        } else {
            let temp = []
            if (this.wallets.length) {
                temp.push({
                    sectionName: 'Local',
                    key: 'local',
                    list: this.wallets.slice()
                })
            }
            return [
                ...temp,
                ...this.ledgerAccounts.map(item => {
                    return {
                        sectionName: item.name,
                        key: item.publicKey,
                        list: item.accounts.map((acc, i) => {
                            return {
                                name: Vue.filter('ledgerName')(item!.name, i),
                                address: acc
                            }
                        })
                    }
                })
            ]
        }
    }

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
                return Promise.resolve(this.isAddressOwned(addr))
            }
        }
    }

    async precheck(contentsId: number) {
        if (this.dialogOpened) { throw new Error('request is in progress') }
        if (!this.getArgWallets().length) {
            this.snack.open = true
            this.snack.message = 'You have no wallet yet'
            this.snack.actionName = 'Create Now'
            this.snack.action = () => {
                this.snack.open = false
                BUS.$emit('open-tab', { href: 'sync://wallets/local', mode: 'inplace-builtin' })
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

        let enforcedWallet = ''
        let walletsCollection = this.getArgWallets()
        if (option.signer) {
            const signer = option.signer!.toLowerCase()
            enforcedWallet = this.isAddressOwned(signer) ? signer : ''
            if (!enforcedWallet) {
                throw new Error('required signer unavailable')
            } else {
                walletsCollection = this.getArgWallets(signer)
            }
        }

        try {
            this.dialogOpened = true
            const result = await this.$dialog(TxSigningDialog, {
                message: arg,
                // enforce using wallet
                wallets: walletsCollection,
                selectedWallet: enforcedWallet,
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
                const href = getExploreUrl(this.$store.getters.explorer, 'tx', result.txid)
                BUS.$emit('open-tab', { href })
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


        let enforcedWallet = ''
        let walletsCollection = this.getArgWallets()
        if (option.signer) {
            const signer = option.signer!.toLowerCase()
            enforcedWallet = this.isAddressOwned(signer) ? signer : ''
            if (!enforcedWallet) {
                throw new Error('required signer unavailable')
            } else {
                walletsCollection = this.getArgWallets(signer)
            }
        }
        try {
            this.dialogOpened = true
            const result = await this.$dialog(CertSigningDialog, {
                message: arg,
                // enforce using wallet
                wallets: walletsCollection,
                selectedWallet: enforcedWallet,
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
