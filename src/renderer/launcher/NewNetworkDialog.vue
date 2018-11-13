<template>
    <v-dialog v-bind="$attrs" persistent v-model="dialog" max-width="500px">
        <v-btn slot="activator" color="primary darken-1" class="mb-2">New Item</v-btn>
        <v-card>
            <v-card-text>
                <div class="headline">{{isEditing ? 'Edit Network' : 'New Network'}}</div>
                <v-layout>
                    <v-flex>
                        <v-form ref="form" v-model="valid">
                            <v-text-field
                                v-model="form.name"
                                :rules="rules.name"
                                label="Name"
                                required
                            ></v-text-field>
                            <v-text-field
                                :rules="rules.rpcUrl"
                                v-model="form.rpcUrl"
                                label="RPC URL"
                                required
                            ></v-text-field>
                        </v-form>
                    </v-flex>
                </v-layout>
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="primary darken-1" flat @click.native="clear">Cancel</v-btn>
                <v-btn color="primary darken-1" flat @click.native="save">Save</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>
<script lang="ts">
import { Entities } from '../database'
import {
    Vue,
    Component,
    Model,
    Watch,
    Prop,
    Emit
} from 'vue-property-decorator'
import Preferences from '@/renderer/preferences'
import { dialog } from 'electron'

@Component
export default class NewNetworkDialog extends Vue {
    name = 'NewNetworkDialog'
    isEditing = false
    @Model('input')
    value!: boolean

    @Prop()
    editItem!: Entities.Network | null

    dialog = false
    valid = true
    form = {
        name: '',
        rpcUrl: ''
    }
    rules = {
        name: [(v: string) => !!v || 'Name is required'],
        rpcUrl: [(v: string) => !!v || 'RPC URL is required']
    }

    @Watch('value')
    valueChanged(val: boolean) {
        this.dialog = val

        if (this.editItem) {
            this.form.name = this.editItem!.value.name
            this.form.rpcUrl = this.editItem!.value.rpcurl
        }
        this.isEditing = !!this.editItem
    }

    @Watch('dialog')
    valueUpdate(val: boolean) {
        this.dialogChanged(val)
    }
    @Emit('input')
    dialogChanged(val: boolean) { }

    @Emit('updated')
    onEdited(editItem: Entities.Network) { }

    @Emit('cancel')
    onCancel() { }

    clear() {
        this.dialog = false
        let form = this.$refs.form as any
        form.reset()
        this.onCancel()
    }
    save() {
        let form = this.$refs.form as any
        if (!form.validate()) {
            return
        }
        if (this.isEditing) {
            let result = Object.assign({}, this.editItem)
            result.value.name = this.form.name
            result.value.rpcurl = this.form.rpcUrl
            DB.preferences
                .update(this.editItem!.id as any, { value: result.value })
                .then(updated => {
                    if (updated) {
                        this.isEditing = false
                        this.onEdited(result)
                        this.clear()
                    } else {
                        console.error('Edit newwork failed')
                    }
                })
        } else {
            DB.preferences
                .add(
                    Entities.Network.create({
                        name: this.form.name,
                        rpcurl: this.form.rpcUrl
                    })
                )
                .then(() => {
                    this.clear()
                })
        }
    }
}
</script>
