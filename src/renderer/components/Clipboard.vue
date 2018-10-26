<template>
    <v-btn @click.native="onClick" v-bind="$attrs" icon>
        <v-icon>mdi-content-copy</v-icon>
    </v-btn>
</template><script lang="ts">
import { Vue, Prop, Component } from 'vue-property-decorator'
import { clipboard } from 'electron'

@Component
export default class Clipboard extends Vue {
    name = 'clipboard'
    @Prop(String)
    text!: string

    onClick(e: Event) {
        clipboard.writeText(this.text)
    }
}
</script>
