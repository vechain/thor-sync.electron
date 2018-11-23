<template>
    <v-dialog
        content-class="sign-dialog"
        persistent
        v-model="open"
        transition="sign-dialog-transition"
        @keydown.esc="onReturnValue(null)"
    >
        <v-card v-nofocusout>
            <v-layout v-if="showContent" row style="height:450px;">
                <v-layout
                    column
                    style="width:350px;flex:0 0 auto; background-color: rgba(0,0,0,0.15)"
                >
                    <div class="py-2 px-3">
                        <v-layout>
                            <span class="title">Transaction</span>
                            <v-spacer/>
                            <span class="text-truncate caption grey--text pl-2">@{{host}}</span>
                        </v-layout>
                        <div class="text-truncate">
                            <i>{{summary}}</i>
                        </div>
                    </div>
                    <v-expansion-panel
                        expand
                        style="overflow-y:auto;border-radius:1px"
                        popout
                        class="px-1"
                    >
                        <ClauseItem
                            tabindex="-1"
                            v-for="(clause,i) in initValue.clauses"
                            :key="i"
                            :index="i"
                            :clause="clause"
                        />
                    </v-expansion-panel>
                </v-layout>
                <TxSigningPanel
                    width="310"
                    flat
                    tile
                    :initValue="initValue"
                    @returnValue="onReturnValue"
                />
            </v-layout>
        </v-card>
    </v-dialog>
</template>
<script lang="ts">
import { Vue, Component, Prop, Watch, Mixins } from 'vue-property-decorator'
import { normalizeClauses, normalizeTxSignOptions, describe } from './utils'
import { Transaction, cry } from 'thor-devkit'
import { randomBytes } from 'crypto'
import BigNumber from 'bignumber.js'
import { Entities } from '@/renderer/database';
import TableLoader from '../mixins/table-loader'
import TxSigningPanel from './TxSigningPanel.vue'
import Deferred from '@/common/deferred';
import debounce from 'lodash.debounce'
import * as NodeUrl from 'url'
import { remote } from 'electron'

type Clause = Connex.Vendor.Message<'tx'>[number]
@Component
class WalletsLoader extends TableLoader<Entities.Wallet>{
    tableName = DB.wallets.name
    filter = () => DB.wallets.toArray()
}

@Component({
    components: {
        TxSigningPanel,
    }
})
export default class SignTxDialog extends Mixins(WalletsLoader) implements SignTx {
    open = false
    referer: { url: string, title: string } | null = null
    initValue: TxSigningPanel.InitValue | null = null
    returnValue?: Deferred<TxSigningPanel.ReturnValue | null>
    summary = ''
    showContent = false

    get host() {
        if (this.referer) {
            return NodeUrl.parse(this.referer.url).host
        }
        return ''
    }

    updateShowContent !: () => void
    created() {
        this.updateShowContent = debounce(() => {
            this.showContent = this.open
        }, 500)
    }

    @Watch('open')
    openChanged() {
        if (this.open) {
            this.showContent = true
        } else {
            this.updateShowContent()
        }
    }
    async signTx(
        contentsId: number,
        message: Connex.Vendor.Message<'tx'>,
        options: Connex.Vendor.SignOptions<'tx'>,
        referer: {
            url: string
            title: string
        }) {

        if (this.open) { throw new Error('busy') }
        if (!remote.webContents.fromId(contentsId).isFocused()) {
            throw new Error('rejected')
        }
        if (this.rows.length === 0) { throw new Error('rejected') }

        message = normalizeClauses(message)
        options = normalizeTxSignOptions(options)

        let walletIndex = 0
        if (options.signer) {
            walletIndex = this.rows.findIndex(w => w.address!.toLowerCase() === options.signer!.toLowerCase())
            if (walletIndex < 0) {
                throw new Error('bad options: no such signer')
            }
        }
        this.summary = options.summary || describe(message)
        this.referer = referer
        this.initValue = {
            clauses: message.slice(),
            wallets: this.rows.slice(),
            selectedWallet: walletIndex,
            suggestedGas: options.gas || 0,
        }
        this.open = true

        try {
            const returnValue = new Deferred<TxSigningPanel.ReturnValue | null>()
            this.returnValue = returnValue

            const ret = await returnValue
            if (!ret) {
                throw new Error('rejected')
            }
            await DB.txRecords.add({
                id: ret.txId,
                insertTime: Date.now(),
                signer: ret.signer,
                confirmed: 0,
                raw: ret.rawTx,
                referer: { ...referer! },
                summary: [options.summary!, message.map(c => c.desc!)],
                link: options.link || '',
                estimatedFee: ret.estimatedFee,
                receipt: null
            })
            connex.txQueue.send(ret.txId, ret.rawTx)

            return {
                txId: ret.txId,
                signer: ret.signer
            }
        } catch (err) {
            console.warn(err)
            throw err
        } finally {
            this.open = false
        }
    }

    onReturnValue(val: TxSigningPanel.ReturnValue | null) {
        if (this.returnValue) {
            this.returnValue.resolve(val)
        }
    }
}

</script>
<style >
.sign-dialog {
  position: fixed;
  right: 0;
  bottom: 0;
  width: auto;
}
.sign-dialog-transition-enter,
.sign-dialog-transition-leave-to {
  transform: translateY(calc(100% + 40px));
}
</style>
