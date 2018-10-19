<template>
    <v-dialog persistent v-model="dialog" max-width="500px">
        <v-btn slot="activator" color="primary darken-1" class="mb-2">New Item</v-btn>
        <v-card>
            <v-card-text>
                <div class="headline">New Network</div>
                <v-layout>
                    <v-flex>
                        <v-form ref="form" v-model="valid">
                            <v-text-field v-model="form.name" :rules="rules.name" label="Name"
                                required></v-text-field>
                            <v-select :items="types" :rules="rules.type" label="Type" v-model="form.type"
                                item-text="key" item-value="value">
                            </v-select>
                            <v-text-field :rules="rules.rpcUrl" v-model="form.rpcUrl" label="RPC URL"
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
import { Entities } from '../database'
import { Vue, Component } from 'vue-property-decorator'

@Component
export default class NewNetworkDialog extends Vue {
    name = 'NewNetworkDialog'
    dialog = false
    valid = true
    types = [
        {
            key: 'Mainnet',
            value: 'main'
        },
        {
            key: 'Testnet',
            value: 'testnet'
        }
    ]
    form = {
        name: '',
        rpcUrl: '',
        type: ''
    }
    rules = {
        name: [v => !!v || 'Name is required'],
        rpcUrl: [v => !!v || 'RPC URL is required'],
        type: [v => !!v || 'Type is required']
    }

    clear() {
        this.dialog = false
        this.$refs.form.reset()
    }
    save() {
        if (this.$refs.form.validate()) {
            this.dialog = false

            DB.preferences.add(Entities.Network.create({
                name: this.form.name,
                type: this.form.type,
                rpcurl: this.form.rpcUrl
            })).then(() => {
                this.clear()
            })
        }
    }
}
</script>
