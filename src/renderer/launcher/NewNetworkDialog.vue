<template>
    <v-dialog v-bind="$attrs" persistent v-model="dialog" max-width="500px">
        <slot slot="activator" name="activator"/>
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
                <v-btn flat v-if="editItem" @click.native="onDelete" color="error darken-1">Delete</v-btn>
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
    import { dialog } from 'electron'

    @Component
    export default class NewNetworkDialog extends Vue {
        isEditing = false
        @Model('input')
        value!: boolean

        @Prop()
        editItem!: Entities.Preference<'network'> | null

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
                this.form.rpcUrl = this.editItem!.value.rpcUrl
            }
            this.isEditing = !!this.editItem
        }

        @Watch('dialog')
        valueUpdate(val: boolean) {
            this.dialogChanged(val)
        }
        @Emit('input')
        dialogChanged(val: boolean) {}

        @Emit('cancel')
        onCancel() {}

        async onDelete(item: Entities.Preference) {
            if (this.editItem) {
                await GDB.preferences.delete(this.editItem!.id!)
            }
            this.clear()
        }

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
                result.value.rpcUrl = this.form.rpcUrl
                GDB.preferences
                    .update(this.editItem!.id as any, { value: result.value })
                    .then(updated => {
                        if (updated) {
                            this.isEditing = false
                            this.clear()
                        } else {
                            console.error('Edit newwork failed')
                        }
                    })
            } else {
                GDB.preferences
                    .add({
                        key: 'network',
                        value: {
                            name: this.form.name,
                            rpcUrl: this.form.rpcUrl
                        }
                    })
                    .then(() => {
                        this.clear()
                    })
            }
        }
    }
</script>
