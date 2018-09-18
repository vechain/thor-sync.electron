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
import Deferred from '@/base/deferred'

@Component
export default class Comfirm extends Vue {
    private name: string = 'component'
    private dialog: boolean = false
    private deferred = new Deferred<string>()
    created() {
        window.Lib.sign = this.sign
    }

    async sign(contentId: number, Clouse?: object[]) {
        this.dialog = true
        try {
            return await this.deferred
        } finally {
            this.deferred = new Deferred<string>()
        }
    }

    cancel() {
        if (this.dialog) {
            this.dialog = false
            this.deferred.reject(new Error('cancel'))
            this.deferred = new Deferred<string>()
        }
    }

    ok() {
        if (this.dialog) {
            this.dialog = false
            this.deferred.resolve('ok')
            this.deferred = new Deferred<string>()
        }
    }
}
</script>
