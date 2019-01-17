<template>
    <DialogEx persistent v-model="show" @action:ok="onOk" @action:cancel="onCancel" max-width="450px">
        <slot slot="activator" name="activator"/>
        <v-card>
            <v-card-title class="subheading">{{isEditing ? 'Edit Node' : 'New Node'}}</v-card-title>
            <v-form ref="form" v-model="valid">
                <v-card-text>
                    <v-text-field
                        v-focus
                        validate-on-blur
                        v-model="form.name"
                        :rules="rules.name"
                        label="Name"
                    ></v-text-field>
                    <v-text-field
                        v-model="form.rpcUrl"
                        :error="error.isError"
                        :disabled="isEditing"
                        :error-messages="error.message"
                        label="URL"
                    ></v-text-field>
                </v-card-text>
                <v-divider/>
                <v-card-actions>
                    <v-btn
                        flat
                        small
                        v-if="isEditing"
                        :disabled="checking"
                        @click.native="onDelete"
                        class="error"
                    >Delete</v-btn>
                    <v-spacer></v-spacer>
                    <v-btn flat small :disabled="checking" @click.native="onCancel">Abort</v-btn>
                    <v-btn
                        small
                        :flat="!checking"
                        :loading="checking"
                        @click="save"
                        ref="submit"
                        class="primary"
                    >Save</v-btn>
                </v-card-actions>
            </v-form>
        </v-card>
    </DialogEx>
</template>
<script lang="ts">
import {
    Vue,
    Component,
    Model,
    Watch,
    Prop,
    Emit,
    Mixins
} from 'vue-property-decorator'
import { dialog, remote } from 'electron'
import { resolve } from 'path'
import { rejects } from 'assert'
import DialogHelper from '../mixins/dialog-helper'

@Component
export default class NewNodeDialog extends Mixins(
    class extends DialogHelper<entities.Node | null, void> { }
) {
    isEditing = false
    show = false
    error = {
        isError: false,
        message: ''
    }

    checking = false
    @Model('input')
    value!: boolean

    valid = true
    form = {
        name: '',
        rpcUrl: ''
    }

    rules = {
        name: [(v: string) => !!v || 'Name is required'],
        rpcUrl: [(v: string) => !!v || 'URL is required']
    }

    @Watch('show')
    valueUpdate(val: boolean) {
        if (!this.show) {
            this.$resolve(undefined)
        }
    }

    onCancel() {
        if (this.checking) {
            return
        }
        this.show = false
    }

    created() {
        if (this.arg && this.arg!.id) {
            this.form.name = this.arg!.name
            this.form.rpcUrl = this.arg!.url
            this.isEditing = true
        }
    }

    mounted() {
        this.show = true
    }

    onOk() {
        const el = (this.$refs.submit as Vue).$el
        el.focus()
        el.click()
    }

    async onDelete(item: entities.Node) {
        if (this.arg) {
            await GDB.nodes.delete(this.arg!.id!)
        }
        this.onCancel()
    }

    getNodeInfo() {
        return new Promise<Connex.Thor.Block>((resolve, reject) => {
            try {
                new URL(this.form.rpcUrl)
            } catch (error) {
                reject(error)
            }

            CLIENT.discoverNode(this.form.rpcUrl)
                .then(resp => {
                    resolve(resp)
                })
                .catch(error => {
                    reject(error)
                })
        })
    }

    async save() {
        let form = this.$refs.form as any
        if (!form.validate()) {
            return
        }

        if (this.checking) {
            return
        }

        if (this.isEditing) {
            let result = Object.assign({}, this.arg)
            result.name = this.form.name
            result.url = this.form.rpcUrl
            GDB.nodes
                .update(this.arg!.id as any, { ...result })
                .then(updated => {
                    if (updated) {
                        this.isEditing = false
                    } else {
                        LOG.error('Edit node failed')
                    }
                })
        } else {
            let genesis: Connex.Thor.Block
            this.checking = true
            try {
                genesis = await this.getNodeInfo()
            } catch (error) {
                if (error) {
                    this.checking = false
                    this.error.isError = true
                    this.error.message = `${error.name}: ${error.message}`
                }
                return
            }
            this.checking = false
            GDB.nodes
                .add({
                    name: this.form.name,
                    url: this.form.rpcUrl,
                    genesis: genesis
                })
        }
        this.onCancel()
    }
}
</script>
