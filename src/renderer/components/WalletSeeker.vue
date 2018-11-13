<template>
    <v-window :value="value" @input="$emit('input', $event)"           >
        <v-window-item v-for="(wallet,i) in wallets" :key="i">
            <v-layout row align-center justify-center>
                <WalletCard flat compact class="outline" :wallet="wallet" style="border-radius:8px;width:160px;"/>
            </v-layout>
        </v-window-item>
        <v-layout
            v-show="wallets.length > 1"
            row
            align-center
            style="position:absolute;left:0;top:0;width:100%;height:100%"
        >
            <v-btn
                :ripple="false"
                icon
                flat
                @click.stop="$emit('input', value - 1)"
                :disabled="disabled || value<1"
            >
                <v-icon>mdi-chevron-left</v-icon>
            </v-btn>
            <v-spacer/>
            <v-btn
                :ripple="false"
                icon
                flat
                @click.stop="$emit('input', value + 1)"
                :disabled="disabled || value>=wallets.length-1"
            >
                <v-icon>mdi-chevron-right</v-icon>
            </v-btn>
        </v-layout>
    </v-window>
</template>
<script lang="ts">
import { Vue, Component, Prop, Model, Emit, Watch } from 'vue-property-decorator'
import { Entities } from '@/renderer/database'

@Component
export default class WalletSeeker extends Vue {
    @Prop({ default: () => [] }) wallets!: Entities.Wallet[]
    @Prop(Boolean) disabled!: boolean
    @Prop(Number) value!: number

}
</script>

