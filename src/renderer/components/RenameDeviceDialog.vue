<template>
    <DialogEx
        persistent
        v-model="show"
        @action:ok="onOk"
        @action:cancel="show=false"
        max-width="450px"
    >
        <v-card>
            <v-card-title class="subheading">Rename Ledger</v-card-title>
            <v-card-text>
                <v-text-field
                    ref="nameInput"
                    type="text"
                    v-focus
                    required
                    validate-on-blur
                    placeholder="Please type a device name"
                    label="Device Name"
                    :counter="20"
                    v-model.trim="name"
                    :rules="nameRules"
                    :loading="checking"
                ></v-text-field>
            </v-card-text>
            <v-divider />
            <v-card-actions>
                <v-btn small flat @click.stop="close">Abort</v-btn>
                <v-spacer></v-spacer>
                <v-btn
                    small
                    ref="submit"
                    flat
                    type="button"
                    @click="onNext"
                    class="primary"
                    :disabled="checking"
                >Rename</v-btn>
            </v-card-actions>
        </v-card>
    </DialogEx>
</template>
<script lang="ts">
import { Vue, Component, Watch, Prop, Mixins } from 'vue-property-decorator'
import { cry } from 'thor-devkit'
import DialogHelper from '@/renderer/mixins/dialog-helper'
import { setTimeout } from 'timers'

type Arg = {
    name: string
    id?: number
}
@Component
export default class RenameDeviceDialog extends Mixins(
    class extends DialogHelper<Arg, void> { }
) {
    name = ''
    show = false
    checking = false
    nameRules = [
        (v: string) => (!!v && !!v.trim()) || 'Device name is required',
        (v: string) => v.length <= 20 || 'Device name must be less than 20 characters'
    ]

    mounted() {
        this.name = this.arg.name
        this.show = true
    }

    @Watch('show')
    showChanged(val: boolean) {
        if (!val) {
            this.$resolve(undefined)
        }
    }

    async onNext() {
        this.checking = true
        const filed = this.$refs.nameInput as any

        if (filed.validate()) {
            await this.updateLedger()
            this.close()
        }
        this.checking = false
    }

    close() {
        this.show = false
    }

    async updateLedger() {
        if (this.arg) {
            LDDB.devices
            .where('id')
            .equals(this.arg.id!)
            .modify({ name: this.name })
        }
    }

    onOk() {
        const btn = (this.$refs.submit as Vue).$el
        btn.focus()
        btn.click()
    }
}
</script>

