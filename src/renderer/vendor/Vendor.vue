<template>
    <div style="position: absolute;">
        <SignTxDialog ref="signTxDlg" />
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
    mounted() {
        const signTxDlg = this.$refs.signTxDlg as SignTxDialog
        remote.app.EXTENSION.inject(
            ENV.contents!.id,
            `vendor.${ENV.xargs!.clientId![0]}`, {
                signTx: (
                    clientId: string[],
                    message: Connex.Vendor.Message<'tx'>,
                    options: Connex.Vendor.SignOptions<'tx'> | undefined,
                    callback: (err?: Error, result?: Connex.Vendor.SignResult<'tx'>) => void
                ) => {
                    signTxDlg.signTx(clientId, message, options)
                        .then(r => callback(undefined, r))
                        .catch(err => callback(serializeError(err)))
                }
            })
    }
}
</script>
