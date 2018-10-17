<template>
    <OverlayedMenu :close-on-content-click="false" v-bind="$attrs" v-on="$listeners" v-model="opened" min-width="200px" max-width="250px">
        <!-- slot of v-menu activator -->
        <slot slot="activator" name="activator" />
        <v-list three-line dense>
            <template v-for="(wallet,i) in unselected">
                <v-divider v-if="i>0" :key="wallet.address+'-divider'">
                </v-divider>
                <WalletCard listitem @click="select(wallet)" :key="wallet.address" :wallet="wallet" :track="opened" />
            </template>
        </v-list>
    </OverlayedMenu>
</template>
<script lang="ts">
import { Vue, Component, Prop, Model, Emit } from 'vue-property-decorator'
import OverlayedMenu from './OverlayedMenu.vue'
import Wallet from '../wallet'
import WalletCard from './WalletCard.vue'

@Component({
    components: {
        OverlayedMenu,
        WalletCard
    }
})
export default class WalletSelection extends Vue {
    @Prop({ default: () => [] }) wallets!: Wallet.Entity[]
    @Model('select') selected!: Wallet.Entity
    @Emit('select')
    select(wallet: Wallet.Entity) {
        this.opened = false
    }
    opened = false

    get unselected() {
        return this.wallets.filter(w => {
            if (this.selected) {
                return w.address.toUpperCase() !== this.selected.address.toUpperCase()
            }
            return true
        })
    }
}
</script>
