<template>
    <v-dialog persistent v-model="dialog" max-width="500px">
        <v-card>
            <v-card-actions>
                <v-btn color="green darken-1" flat="flat" @click="cancel">
                    Cancel
                </v-btn>
                <v-btn color="green darken-1" flat="flat" @click="ok">
                    Ok
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>
<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'
let _resolve: <T>(value?: T | PromiseLike<T>) => void
let _reject: <T>(value?: T | PromiseLike<T>) => void
@Component
export default class Comfirm extends Vue {
    private name: string = 'component'
    private dialog: boolean = false
    private resolve?: Promise<any>

    created() {
        Object.defineProperty(window, 'sign', {
            enumerable: true,
            value: this.sign
        })
    }

    async sign(contentId: number) {
        this.dialog = true
        return new Promise((resolve, reject) => {
            _resolve = resolve
            _reject = reject
        })
    }
    cancel() {
        this.dialog = false
        _reject(1)
    }

    ok() {
        this.dialog = false
        _resolve(2)
    }
    // async showDialog() {

    // }
}
</script>
