<template>
    <v-dialog v-bind="$attrs" persistent v-model="dialog" max-width="500px">
        <v-btn slot="activator" color="primary darken-1" class="mb-2">New Item</v-btn>
        <v-card>
            <v-card-text>
                <div class="headline">{{isEditing ? 'Edit Shortcut' : 'New Shortcut'}}</div>
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
                                :rules="rules.domain"
                                v-model="form.domain"
                                label="Domain"
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
import {
    Vue,
    Component,
    Watch,
    Model,
    Prop,
    Emit
} from 'vue-property-decorator'
import { Entities } from '../database'
import { dialog } from 'electron'
@Component
export default class NewShortcutDialog extends Vue {
    name = 'NewShortcutDialog'
    isEditing = false
    dialog = false
    valid = true
    form = {
        name: '',
        domain: ''
    }
    rules = {
        name: [(v: string) => !!v || 'Name is required'],
        domain: [(v: string) => !!v || 'Domain is required']
    }

    @Model('input')
    value!: boolean

    @Watch('value')
    valueChanged() {
        this.dialog = this.value
        if (this.editItem) {
            this.form.name = this.editItem.value.name
            this.form.domain = this.editItem.value.href
        }

        this.isEditing = !!this.editItem
    }

    @Watch('dialog')
    valueUpdate(val: boolean) {
        this.dialogChanged(val)
    }
    @Emit('input')
    dialogChanged(val: boolean) { }

    @Emit('cancel')
    onCancel() { }

    @Prop()
    editItem!: Entities.Preference<'shortcut'> | null

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
            result.value.href = this.form.domain
            GDB.preferences
                .update(this.editItem!.id as any, result)
                .then(updated => {
                    if (updated) {
                        this.isEditing = false
                        this.clear()
                    } else {
                        console.error('shortcut edit failed')
                    }
                })
        } else {
            GDB.preferences
                .add({
                    key: 'shortcut',
                    value: {
                        name: this.form.name,
                        href: this.form.domain
                    }
                }).then(() => {
                    this.clear()
                })
        }
    }
}
</script>

