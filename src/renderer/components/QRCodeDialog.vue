<template>
    <v-dialog origin="bottom right" v-bind="$attrs">
        <v-card>
            <v-card-text>
                <QRCode :pre="pre" :size="size">{{content}}</QRCode>
            </v-card-text>
        </v-card>
        <slot slot="activator" name="activator" />
    </v-dialog>
</template>
<script lang="ts">
import QRCode from './QRCode.vue'
import { Vue, Component, Prop } from 'vue-property-decorator'
@Component({
    components: {
        QRCode
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

