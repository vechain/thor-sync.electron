<template>
    <v-window v-model="index">
        <v-window-item v-for="(wallet,i) in wallets" :key="i">
            <v-layout row align-center justify-center>
                <WalletCard flat compact :wallet="wallet" style="border-radius:8px;width:160px;"/>
            </v-layout>
        </v-window-item>
        <v-layout row align-center style="position:absolute;left:0;top:0;width:100%;height:100%">
            <v-btn icon flat @click="index--" :disabled="index<1" :style="btnStyleObject">
                <v-icon>mdi-chevron-left</v-icon>
            </v-btn>
            <v-spacer/>
            <v-btn
                icon
                flat
                @click="index++"
                :disabled="index>=wallets.length-1"
                :style="btnStyleObject"
            >
                <v-icon>mdi-chevron-right</v-icon>
            </v-btn>
        </v-layout>
    </v-window>
</template>
<script lang="ts">
import { Vue, Component, Prop, Model, Emit, Watch } from 'vue-property-decorator'
import WalletCard from './WalletCard.vue'
import { Entities } from '@/renderer/database'

@Component({
    components: {
        WalletCard
    }
})
export default class WalletSeeker extends Vue {
    @Prop({ default: () => [] }) wallets!: Entities.Wallet[]

    @Model('select', { type: Object }) selection!: Entities.Wallet
    @Emit('select')
    emitSelect(val: Entities.Wallet) { }
    @Watch('selection')
    selectionChanged(val: Entities.Wallet) {
        let index = this.wallets.findIndex(w => w === val)
        if(index < 0) {
            index = 0
        }
        this.index = index                
    }

    index = 0
    @Watch('index')
    indexChanged(val: number) {
        this.emitSelect(this.wallets[val])
    }

    get btnStyleObject() {
        return {
            visibility: this.wallets.length > 1 ? 'visible' : 'hidden'
        }
    }
}
</script>

