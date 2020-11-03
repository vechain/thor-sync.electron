<template>
    <DialogEx
        persistent
        v-model="show"
        @action:ok="onOk"
        @action:cancel="onClose"
        max-width="450px"
    >
        <slot slot="activator" name="activator" />
        <v-card>
            <v-card-title class="subheading">{{isEdit ? 'Edit Node' : 'New Node'}}</v-card-title>
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
                        :disabled="isEdit"
                        :error-messages="error.message"
                        label="URL"
                    ></v-text-field>
                </v-card-text>
                <v-divider />
                <v-card-actions>
                    <v-btn
                        flat
                        small
                        v-if="isEdit"
                        :disabled="processing"
                        @click.native="onDelete"
                        class="error"
                    >Delete</v-btn>
                    <v-spacer></v-spacer>
                    <v-btn flat small :disabled="processing" @click.native="onClose">Abort</v-btn>
                    <v-btn
                        small
                        :flat="!processing"
                        :loading="processing"
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
    Mixins,
} from 'vue-property-decorator'
import { dialog, remote } from 'electron'
import { resolve } from 'path'
import { rejects } from 'assert'
import DialogHelper from '../mixins/dialog-helper'

@Component
export default class NewNodeDialog extends Mixins(
    class extends DialogHelper<
        entities.Node | null,
        {
            action?: 'edit' | 'delete'
            node?: entities.Node
        } | undefined
    > {}
) {
    isEdit = false
    show = false
    error = {
        isError: false,
        message: ''
    }

    processing = false
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

    onClose(action?: 'edit' | 'delete', node?: entities.Node) {
        this.show = false
        this.$resolve({action, node})
    }

    created() {
        if (this.arg && this.arg!.id) {
            this.form.name = this.arg!.name
            this.form.rpcUrl = this.arg!.url
            this.isEdit = true
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

    async onDelete() {
        if (this.arg && this.arg.id) {
            await GDB.nodes.delete(this.arg.id!)
            this.onClose('delete', this.arg)
        }
    }

    async getNodeInfo(): Promise<Connex.Thor.Block> {
        // tslint:disable-next-line:no-unused-expression
        new URL(this.form.rpcUrl)

        return discoverNode(this.form.rpcUrl)
    }

    async save() {
        let form = this.$refs.form as any
        if (!form.validate()) {
            return
        }

        if (this.processing) {
            return
        }

        try {
            this.processing = true
            if (this.isEdit) {
                let result = Object.assign({}, this.arg)
                result.name = this.form.name
                result.url = this.form.rpcUrl
                await GDB.nodes.update(this.arg!.id as any, { ...result })
                this.onClose('edit', { ...result, id: this.arg!.id })
            } else {
                let genesis: Connex.Thor.Block
                try {
                    this.error.isError = false
                    this.error.message = ''
                    genesis = await this.getNodeInfo()
                } catch (error) {
                    this.processing = false
                    if (error) {
                        this.error.isError = true
                        this.error.message = `${error.name}: ${error.message}`
                    }
                    return
                }
                await GDB.nodes.add({
                    name: this.form.name,
                    url: this.form.rpcUrl,
                    genesis: genesis,
                })
                this.onClose()
            }
        } catch (error) {
            this.processing = false
            LOG.error('Edit node failed')
        } finally {
            this.processing = false
        }
    }
}

import { SimpleNet } from '@vechain/connex.driver-nodejs/dist/simple-net'

async function discoverNode(url: string) {
    const net = new SimpleNet(url)
    const genesis = (await net.http('GET', 'blocks/0')) || {}

    // TODO full validation
    if (genesis && !/^0x[0-9a-f]{64}$/i.test(genesis.id)) {
        throw new NotValidNode('malformed response')
    }
    return genesis
}

class NotValidNode extends Error {
    constructor(cause: string) {
        if (cause) {
            super(`not a valid VeChain node [${cause}]`)
        } else {
            super(`not a valid VeChain node`)
        }
    }
}
</script>
