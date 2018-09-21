<template>
    <v-app id="uix">
        <v-content>
            <SignTxDialog :data="signTxData" />
        </v-content>
    </v-app>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import SignTxDialog from './components/SignTxDialog.vue'
@Component({
    components: {
        SignTxDialog
    }
})
export default class UIX extends Vue {
    name: string = 'uix'
    signTxData: SignTxDialog.Data | null = null

    created() {
        const _this = this
        const uix: (typeof window.UIX) = {
            signTx(origin: string, clauses: Connex.Thor.Clause[]) {
                return _this.signTx(origin, clauses)
            }
        }
        Object.defineProperty(window, 'UIX', {
            value: uix,
            enumerable: true
        })
    }

    signTx(origin: string, clauses: Connex.Thor.Clause[]) {
        return new Promise<string>((resolve, reject) => {
            this.signTxData = {
                origin,
                clauses,
                callback(err, result) {
                    err ? reject(err) : resolve(result)
                }
            }
        })
    }
}
</script>
<style lang="scss" scoped>
#uix {
  position: absolute;
}
</style>


