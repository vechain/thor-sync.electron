<template>
    <div>
        <v-select
            v-focus
            :disabled="disabled"
            v-model="form.type"
            @change="checkContent"
            :items="types"
            item-text="text"
            item-value="value"
        ></v-select>
        <v-textarea
            v-model.trim="form.content"
            ref="content"
            :disabled="disabled"
            box
            no-resize
            validate-on-blur
            @keypress.enter.stop
            :rules="[validateContent]"
            :label="types[form.type - 1]['text']"
        ></v-textarea>
        <v-text-field
            :disabled="disabled"
            label="Password"
            :error="error.isError"
            @change="pwdChanged"
            :error-messages="error.messages"
            v-if="form.type === 1"
            v-model="form.pwd"
            type="password"
        ></v-text-field>
    </div>
</template>
<script lang="ts">
import {
    Vue,
    Component,
    Prop,
    Emit,
    Model,
    Watch
} from 'vue-property-decorator'
import { cry } from 'thor-devkit'
import { watch } from 'fs'

interface IContentForm {
    getPrivateKey(): Promise<Buffer>
    reset(): void
}

@Component
export default class ContentForm extends Vue implements IContentForm {
    @Prop()
    disabled!: boolean
    name = 'wallet_content_form'

    error: { isError: boolean, messages: string } = {
        isError: false,
        messages: ''
    }
    form = {
        type: 1,
        content: '',
        pwd: ''
    }

    contentError: boolean = false
    contentErrorMsg: string[] = []

    types = [
        {
            text: 'Keystore',
            value: 1
        },
        {
            text: 'Mnemonic words',
            value: 2
        },
        {
            text: 'Private key',
            value: 3
        }
    ]

    @Model('update', { default: {} })
    value!: WalletContentForm.Value

    @Watch('form.type')
    @Watch('form.content')
    @Watch('form.pwd')
    emitUpdate() {
        const result: WalletContentForm.Value = {
            type: this.form.type,
            content: this.form.content,
            pwd: this.form.pwd
        }

        this.$emit('update', result)
    }

    @Watch('value.type')
    @Watch('value.content')
    @Watch('value.pwd')
    valueChange() {
        this.form.type = this.value.type || 1
        this.form.content = this.value.content || ''
        this.form.pwd = this.value.pwd || ''
    }

    pwdChanged() {
        this.error.isError = false
        this.error.messages = ''
    }

    valid(): boolean {
        const c = this.$refs.content as any
        return c.validate(true)
    }

    validateContent() {
        const type = this.form.type
        let result: string | boolean = false
        const content = this.form.content
        switch (type) {
            case 1:
                result = this.validateKeyStore(content) || 'Keystore is invalid'
                break
            case 2:
                result =
                    this.validateWords(content) || 'Mnemonic words are invalid'
                break
            case 3:
                result = this.validatePrivate(content) || 'Private key invalid'
                break
        }

        return result
    }
    validateKeyStore(content: string) {
        if (content) {
            let ks = ''
            try {
                ks = JSON.parse(this.form.content)
            } catch (error) {
                return 'Keystore is invalid'
            }

            return cry.Keystore.wellFormed(ks)
        } else {
            return 'Keystore is required'
        }
    }
    validatePrivate(content: string) {
        if (content) {
            const pk = this.form.content.startsWith('0x')
                ? this.form.content.substr(2)
                : this.form.content
            const buff = Buffer.from(pk, 'hex')
            const length = buff.filter(item => item === 0).length
            return buff.length === 32 && length !== 32
        } else {
            return 'Private key is required'
        }
    }
    validateWords(content: string) {
        if (content) {
            return cry.mnemonic.validate(this.form.content.split(' '))
        } else {
            return 'Mnemonic words are required'
        }
    }

    checkContent() {
        if (this.form.content) {
            this.valid()
        }
    }

    reset() {
        this.form = {
            type: 1,
            content: '',
            pwd: ''
        }
        this.contentError = false
        this.contentErrorMsg = []
        this.emitUpdate()
    }

    async getPrivateKey(): Promise<Buffer> {
        const type = this.form.type
        let result = Buffer.alloc(0)
        switch (type) {
            case 1:
                const ks = JSON.parse(this.form.content)
                try {
                    result = await cry.Keystore.decrypt(ks, this.form.pwd)
                    this.error.isError = false
                    this.error.messages = ''
                } catch (error) {
                    this.error.isError  = true
                    this.error.messages = 'Password is invalid'
                    return Promise.reject('')
                }
                break
            case 2:
                result = cry.mnemonic.derivePrivateKey(
                    this.form.content.split(' ')
                )
                break
            case 3:
                const pk = this.form.content.startsWith('0x')
                    ? this.form.content.substr(2)
                    : this.form.content
                result = Buffer.from(pk, 'hex')
                break
        }

        if (result.length !== 32) {
            this.error.isError = true
            this.error.messages = 'Unexpected error'

            return Promise.reject('')
        } else {
            this.error.isError = false
            this.error.messages = ''
        }
        return result
    }
}
</script>
