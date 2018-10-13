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
export default class UIXRoot extends Vue {
    mounted() {
        const signTxDlg = this.$refs.signTxDlg as SignTxDialog
        remote.app.EXTENSION.inject(
            ENV.contents!.id,
            `uix.${ENV.xargs!.clientId![0]}`, {
                signTx: (
                    clientId: string[],
                    clauses: Connex.Thor.Clause[],
                    options: Connex.Vendor.Options<'tx'> | undefined,
                    callback: (err?: Error, result?: Connex.Vendor.Signed<'tx'>) => void
                ) => {
                    signTxDlg.signTx(clientId, clauses, options)
                        .then(r => callback(undefined, r))
                        .catch(err => callback(serializeError(err)))
                }
            })
    }
}
</script>
