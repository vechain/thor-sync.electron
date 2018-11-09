<template>
    <div style="position: absolute;left:0;top:0;right:0">
        <v-snackbar v-model="snackbar" :timeout="6000" top right absolute>
            {{snackbarText}}
            <v-btn flat @click="snackbar = false">Close</v-btn>
        </v-snackbar>
        <SignTxDialog ref="signTxDlg"/>
    </div>
</template>
<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { remote } from 'electron'
import SignTxDialog from './SignTxDialog.vue'
import serializeError from 'serialize-error'

@Component({
    components: {
        SignTxDialog
    }
})
export default class Vendor extends Vue {
    snackbar = false
    snackbarText = ''
    mounted() {
        const signTxDlg = this.$refs.signTxDlg as SignTxDialog
        remote.app.EXTENSION.inject(
            ENV.contents!.id,
            `vendor.${ENV.xargs!.clientId![0]}`, {
                signTx: (
                    clientId: string[],
                    message: Connex.Vendor.Message<'tx'>,
                    options: Connex.Vendor.SignOptions<'tx'>,
                    referer: { url: string, title: string },
                    callback: (err?: Error, result?: Connex.Vendor.SignResult<'tx'>) => void
                ) => {
                    signTxDlg.signTx(clientId, message, options, referer)
                        .then(r => {
                            setTimeout(() => {
                                this.snackbarText = 'Transaction signed and enqueued'
                                this.snackbar = true
                            }, 500)
                            callback(undefined, r)
                        })
                        .catch(err => callback(serializeError(err)))
                }
            })
    }
}
</script>
