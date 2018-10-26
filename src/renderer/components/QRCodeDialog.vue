<template>
    <v-dialog origin="bottom right" v-bind="$attrs">
        <v-card>
            <v-card-text>
                <QRcode :pre="pre" :size="size">{{content}}</QRcode>
            </v-card-text>
        </v-card>
        <slot slot="activator" name="activator" />
    </v-dialog>
</template>
<script lang="ts">
import QRcode from './QRcode.vue'
import { Vue, Component, Prop } from 'vue-property-decorator'
@Component({
    components: {
        QRcode
    }
})
export default class QRCodeDialog extends Vue {
    name = 'QRCodeDialog'
    @Prop(String)
    content!: string
    @Prop(Number)
    size!: number
    @Prop({default: false})
    pre!: boolean
}
</script>

