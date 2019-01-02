<template>
    <v-form ref="form">
        <v-select v-model="form.type" :items="types" item-text="text" item-value="value"></v-select>
        <v-textarea
            validate-on-blur
            v-model.trim="form.content"
            no-resize
            v-focus
            :rules="[validateContent]"
            outline
            :label="types[form.type - 1]['text']"
        ></v-textarea>
        <v-text-field
            label="Password"
            :error="pwdError.error"
            :error-messages="pwdError.messages"
            v-if="form.type === 1"
            v-model="form.pwd"
            type="password"
        ></v-text-field>
    </v-form>
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
        name = 'wallet_content_form'
        pwdIsError: boolean = false
        form = {
            type: 1,
            content: '',
            pwd: ''
        }

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

        @Emit('update')
        valueUpdate(v: WalletContentForm.Value) {}

        @Watch('form.type')
        @Watch('form.content')
        @Watch('form.pwd')
        emitUpdate() {
            const result: WalletContentForm.Value = {
                type: this.form.type,
                content: this.form.content,
                pwd: this.form.pwd,
                valid: this.valid
            }
            this.valueUpdate(result)
        }

        @Watch('value')
        valueChange() {
            this.form.type = this.value.type || 1
            this.form.content = this.value.content || ''
            this.form.pwd = this.value.pwd || ''
        }

        created() {
            this.valueChange()
        }

        get valid() {
            const form = this.$refs.form as any
            return form.validate()
        }

        validateContent() {
            const type = this.form.type
            let result: string | boolean = false
            const content = this.form.content.trim()
            switch (type) {
                case 1:
                    result = this.validateKeyStore(content) || 'Keystore invalid'
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

        get pwdError() {
            return {
                error: this.pwdIsError,
                messages: this.pwdIsError ? 'Password is invalid' : ''
            }
        }

        reset() {
            let temp = this.$refs.form as any
            this.form = {
                type: 1,
                content: '',
                pwd: ''
            }
            this.emitUpdate()
            temp.reset()
        }

        async getPrivateKey(): Promise<Buffer> {
            const type = this.form.type
            let result = Buffer.alloc(0)
            switch (type) {
                case 1:
                    const ks = JSON.parse(this.form.content)
                    try {
                        result = await cry.Keystore.decrypt(ks, this.form.pwd)
                        this.pwdIsError = false
                    } catch (error) {
                        this.pwdIsError = true
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
            return Promise.resolve(result)
        }
    }
</script>
