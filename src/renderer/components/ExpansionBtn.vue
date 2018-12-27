<template>
    <v-btn v-bind="$attrs" v-on="$listeners" @click="onClick" @blur="onBlur">
        <slot/>
        <div
            style="overflow: hidden;position:relative;transition:all 0.2s;transition-timing-function:ease"
            :style="contentStyleObject"
        >
            <div ref="contentWrapper" style="position:absolute;left:0;top:0;">
                <slot name="expansion"/>
            </div>
        </div>
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

    contentSize = { x: 0, y: 0 };

    get contentStyleObject() {
        return {
            width: this.expanded ? this.contentSize.x + 'px' : '0px',
            height: this.contentSize.y + 'px',
            opacity: this.expanded ? 1 : 0
        }
    }

    onClick() {
        if (this.blurTimer) {
            clearTimeout(this.blurTimer)
            this.blurTimer = undefined
        }

        if (this.expanded) {
            setTimeout(() => this.emitAction(), 200)
            this.expanded = false
        } else {
            this.expanded = true
            this.$el.focus()
        }
    }
    onBlur() {
        this.blurTimer = setTimeout(() => this.expanded = false, 100)
    }
    beforeUpdate() {
        this.contentSize.x = (this.$refs.contentWrapper as HTMLElement).clientWidth
        this.contentSize.y = (this.$refs.contentWrapper as HTMLElement).clientHeight
    }
}    
</script>

