<template>
    <v-btn v-bind="$attrs" v-on="$listeners" @click="onClick" @blur="onBlur">
        <slot/>
        <span v-show="expanded">
            <slot name="expansion"/>
        </span>
    </v-btn>
</template>
<script lang="ts">
import { Vue, Prop, Emit, Component } from 'vue-property-decorator'

@Component
export default class ExpansionBtn extends Vue {
    @Emit('action')
    emitAction() { }

    expanded = false

    blurTimer: any

    onClick() {
        if (this.blurTimer) {
            clearTimeout(this.blurTimer)
            this.blurTimer = undefined
        }

        if (this.expanded) {
            this.emitAction()
            this.expanded = false
        } else {
            this.expanded = true
            this.$el.focus()
        }
    }
    onBlur() {
        this.blurTimer = setTimeout(() => this.expanded = false, 100)
    }
}    
</script>

