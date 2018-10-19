<template>
    <v-dialog persistent v-model="dialog" max-width="500px">
        <v-btn slot="activator" color="primary darken-1" class="mb-2">New Item</v-btn>
        <v-card>
            <v-card-text>
                <div class="headline">New Shortcut</div>
                <v-layout>
                    <v-flex>
                        <v-form ref="form" v-model="valid">
                            <v-text-field v-model="form.name" :rules="rules.name" label="Name"
                                required></v-text-field>
                            <v-text-field :rules="rules.domain" v-model="form.domain" label="Domain"
                                required></v-text-field>
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
import { Vue, Component } from 'vue-property-decorator'
import { Entities } from '../database'
import { dialog } from 'electron'
@Component
export default class NewShortcutDialog extends Vue {
    name = 'NewShortcutDialog'
    dialog = false
    valid = true
    form = {
        name: '',
        domain: ''
    }
    rules = {
        name: [v => !!v || 'Name is required'],
        domain: [v => !!v || 'Domain is required']
    }

    clear() {
        this.dialog = false
        this.$refs.form.reset()
    }
    save() {
        if (this.$refs.form.validate()) {
            DB.preferences.add(Entities.Shortcut.create({
                name: this.form.name,
                domain: this.form.domain
            })).then(() => {
                this.clear()
            })
        }
    }
}
</script>

