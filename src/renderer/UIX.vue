<template>
    <v-app id="uix">
        <v-content>
            <Confirm ref="sign" />
        </v-content>
    </v-app>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import Confirm from './components/Confirms.vue'
@Component({
    components: {
        Confirm
    }
})
export default class UIX extends Vue implements UIXMethods {
    name: string = 'uix'
    signTx(address: string, clauses: Connex.Thor.Clause[]) {
        return (this.$refs['sign'] as any).sign(clauses, address)
    }
}
</script>
<style lang="scss" scoped>
#uix {
  position: absolute;
}
</style>


