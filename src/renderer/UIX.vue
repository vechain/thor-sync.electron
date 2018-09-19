<template>
    <v-app id="uix">
        <v-content>
            <Confirm ref="sign"/>
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
export default class UIX extends Vue {
    name: string = 'uix'
    sign() {
        return this.$refs['sign'].sign()
    }
}
</script>
<style lang="scss" scoped>
#uix {
    position: absolute;
}
</style>


