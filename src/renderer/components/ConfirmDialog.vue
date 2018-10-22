<template>
    <v-dialog v-bind="$attrs" persistent v-model="dialog">
        <v-card>
            <v-card-title primary-title class="headline">
                {{title}}
            </v-card-title>
            <v-card-text class="subheading">
                {{content}}
            </v-card-text>
            <v-card-actions>
                <v-spacer/>
                <v-btn color="primary" flat @click="reject" >Cancel</v-btn>
                <v-btn color="primary" flat @click="resolve">Ok</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>
<script lang="ts">
import { Vue, Watch, Component, Prop } from 'vue-property-decorator'
import Deferred from '@/common/deferred'

@Component
export default class ConfirmDialog extends Vue implements ConfirmBox {
    name = 'confirmDialog'
    dialog = false
    result?: Deferred<null>

    @Prop({default: 'Confirm'})
    title!: string
    @Prop({default: 'Are you sure?'})
    content!: string
    
    async confirm() {
        this.dialog = true
        this.result = new Deferred()

        return this.result
    }

    reject() {
        this.dialog = false
        this.result!.reject()
    }
    resolve() {
        this.dialog = false
        this.result!.resolve()
    }
}
</script>
