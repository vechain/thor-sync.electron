<template>
    <span v-if="!slotContent">{{placeholder}}</span>
    <span v-else-if="!address">invalid address</span>
    <div
        v-else-if="icon"
        class="wallet-icon card-border-thin"
        style="overflow:hidden;display:inline-block"
    >
        <IdentBox :text="slotContent.toLowerCase()" style="height:55%;"/>
    </div>
    <span v-else style="font-family: 'Roboto Mono', monospace">{{address}}</span>
</template>
<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
import { Address } from '@/common/formatter'
import { VNodeData } from 'vue'
import IdentBox from './IdentBox.vue'

@Component
export default class AddressLabel extends Vue {
    @Prop(Boolean) icon!: boolean
    @Prop(Boolean) abbrev !: Boolean
    @Prop(String) placeholder !: string

    slotContent = ''

    get address() {
        if (!Address.isValid(this.slotContent)) {
            return undefined
        }
        const checksumed = Address.toChecksum(this.slotContent)!
        if (this.abbrev) {
            return Address.abbrev(checksumed)!
        }
        return checksumed
    }

    created() {
        this.extractSlot()
    }
    beforeUpdate() {

        this.extractSlot()
    }

    extractSlot() {
        this.slotContent = this.$slots.default[0] ? (this.$slots.default[0].text || '').trim() : ''
    }
}
</script>
<style scoped>
.theme--light .wallet-icon {
    background-color: #fff;
}
.theme--dark .wallet-icon {
    background-color: #505050;
}
</style>
