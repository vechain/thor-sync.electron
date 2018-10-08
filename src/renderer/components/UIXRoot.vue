<template>
    <div style="position: absolute;">
        <SignTxDialog :data="signTxData" />
    </div>
</template>
<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import SignTxDialog from './SignTxDialog.vue'
import { remote } from 'electron'
import { promisify } from 'util';

@Component({
    components: {
        SignTxDialog
    }
})
export default class UIXRoot extends Vue {
    signTxData: SignTxDialog.Data | null = null

    created() {
        const signTx = (origin: string, clauses: Connex.Thor.Clause[], callback: (err: Error, result: string) => void) => {
            this.signTxData = {
                origin,
                clauses,
                callback
            }
        }

        window.UIX = {
            signTx: promisify(signTx)
        }

        const uixPath = `uix.${remote.getCurrentWebContents().id}`
        remote.app.inject(uixPath, {
            signTx,
        })
    }
}
</script>
