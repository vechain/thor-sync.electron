<template>
    <div style="position: absolute;">
        <SignTxDialog />
    </div>
</template>
<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import SignTxDialog from './SignTxDialog.vue'

@Component({
    components: {
        SignTxDialog
    }
})
export default class UIXRoot extends Vue {
}
</script>
