<template>
    <v-menu dark left offset-y :close-on-content-click="false" max-width="280px" min-width= "240px" v-model="opened">
        <v-btn light flat slot="activator" @blur="opened=false">
            <div v-if="selectedEntity">
                <IdentIcon :size="14" :address="selectedEntity.address" style="border-radius:3px"></IdentIcon> {{selectedEntity && selectedEntity.name}}
            </div>
            <div v-else>
                not selected
            </div>
        </v-btn>

        <AccountCard v-if="selectedEntity" tile flat :name="selectedEntity.name" :address="selectedEntity.address" :track="true" noicon>
        </AccountCard>
        <v-list dense two-line class="pt-0">
            <template v-for="entity in unselectedEntities">
                <v-divider :key="entity.address+'-divider'">
                </v-divider>
                <AccountCard @click="()=>{}" @mousedown="onClickAccountItem(entity.address)" :key="entity.address" :name="entity.name" :address="entity.address" track listitem>
                </AccountCard>
            </template>
        </v-list>
    </v-menu>
</template>
<script lang="ts">
import { Vue, Component, Prop, Model } from 'vue-property-decorator'
import IdentIcon from './IdentIcon.vue'
import { State } from 'vuex-class'
import Wallet from '../wallet'
import AccountCard from './AccountCard.vue'
import { cry } from 'thor-devkit'

@Component({
    components: {
        AccountCard,
        IdentIcon
    }
})
export default class AccountSwitch extends Vue {
    @State wallets!: Wallet.Entity[]
    @Model('change') selection!: (string | null)

    opened = false

    onClickAccountItem(addr: string) {
        this.$emit('change', addr)
        this.opened = false
    }

    get selectedEntity() {
        if (!this.selection) {
            return null
        }
        for (const wallet of this.wallets) {
            if (wallet.address.toLowerCase() === this.selection.toLowerCase()) {
                return wallet
            }
        }
        return null
    }
    get unselectedEntities() {
        if (!this.selection) {
            return this.wallets
        }
        return this.wallets.filter(w => w.address.toLowerCase() !== this.selection!.toLowerCase())
    }
}
</script>

