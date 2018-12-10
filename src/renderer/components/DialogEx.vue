<template>
    <v-dialog v-bind="$attrs" v-on="$listeners" :value="value" @input="$emit('input', $event)">
        <div v-nofocusout @keypress.enter="onEnter" @keydown.esc="onEsc">
            <slot/>
        </div>
        <slot slot="activator" name="activator"/>
    </v-dialog>
</template>
<script lang="ts">
import { Vue, Component, Emit, Prop } from 'vue-property-decorator'

@Component
export default class DialogEx extends Vue {
    @Prop(Boolean) value !: boolean

    @Emit('action:ok')
    emitOK() { }
    @Emit('action:cancel')
    emitCancel() { }

    onEnter(ev: KeyboardEvent) {
        if (ev.target && (ev.target as any).type === 'button') {
            return
        }
        this.emitOK()
    }

    onEsc(ev: KeyboardEvent) {
        if ((ev as any).isComposing) {
            return
        }
        this.emitCancel()
    }
}
</script>
