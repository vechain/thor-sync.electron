<template>
    <DialogEx v-model="show" @action:cancel="show=false" max-width="500px">
        <slot slot="activator" name="activator"/>
        <v-card>
            <v-form @submit.prevent="save" ref="form" v-model="valid">
                <v-card-text>
                    <div class="headline">{{isEditing ? 'Edit Node' : 'New Node'}}</div>
                    <v-layout>
                        <v-flex>
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
                                :loading="checking"
                            ></v-text-field>
                        </v-flex>
                    </v-layout>
                </v-card-text>
                <v-card-actions>
                    <v-btn
                        flat
                        v-if="isEditing"
                        @click.native="onDelete"
                        color="error darken-1"
                    >Delete</v-btn>
                    <v-spacer></v-spacer>
                    <v-btn color="primary darken-1" flat @click.native="clear">Cancel</v-btn>
                    <v-btn :disabled="checking" type="submit" color="primary darken-1" flat>Save</v-btn>
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
        class extends DialogHelper<entities.Node | null, void> {}
    ) {
        isEditing = false
        show = false
        error = {
            isError: false,
            message: ''
        }
        checkingReject?: () => void
        checking = false
        @Model('input')
        value!: boolean

        // editItem?: Entities.Preference<'node'>
        valid = true
        form = {
            name: '',
            rpcUrl: ''
        }

        rules = {
            name: [(v: string) => !!v || 'Name is required'],
            rpcUrl: [(v: string) => !!v || 'URL is required']
        }

        // @Watch('value')
        // valueChanged(val: boolean) {
        //     this.show = val
        //     if (this.editItem) {
        //         this.form.name = this.editItem!.value.name
        //         this.form.rpcUrl = this.editItem!.value.url
        //     }
        //     this.isEditing = !!this.editItem
        // }

        @Watch('show')
        valueUpdate(val: boolean) {
            if (!this.show) {
                this.$resolve(undefined)
            }
        }

        // @Emit('input')
        // dialogChanged(val: boolean) {}

        @Emit('cancel')
        onCancel() {}

        created() {
            if (this.arg!.id) {
                this.form.name = this.arg!.name
                this.form.rpcUrl = this.arg!.url
                this.isEditing = true
            }
        }

        mounted() {
            this.show = true
        }

        async onDelete(item: entities.Node) {
            if (this.arg) {
                await GDB.preferences.delete(this.arg!.id!)
            }
            this.clear()
        }

        clear() {
            this.show = false
            let form = this.$refs.form as any
            form.reset()
            this.error = {
                isError: false,
                message: ''
            }
            if (this.checkingReject) {
                this.checkingReject()
            }
            this.checking = false
            this.onCancel()
        }

        getNodeInfo() {
            return new Promise<Connex.Thor.Block>((resolve, reject) => {
                this.checkingReject = reject
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

            if (this.isEditing) {
                let result = Object.assign({}, this.arg)
                result.name = this.form.name
                result.url = this.form.rpcUrl
                // result.value.genesis = genesis
                GDB.nodes
                    .update(this.arg!.id as any, { ...result })
                    .then(updated => {
                        if (updated) {
                            this.isEditing = false
                            this.clear()
                        } else {
                            console.error('Edit node failed')
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
                    .then(() => {
                        this.clear()
                    })
            }
        }
    }
</script>
