<template>
    <v-form ref="form">
        <v-text-field
            validate-on-blur
            :disabled="disabled"
            label="Wallet name"
            :counter="20"
            maxlength="20"
            v-model="name"
            :rules="[nameRule, nameLength]"
        ></v-text-field>
        <v-text-field
            validate-on-blur
            :disabled="disabled"
            label="Password"
            type="password"
            maxlength="20"
            v-model="password"
            :rules="[passwordRule]"
        ></v-text-field>
        <v-text-field
            validate-on-blur
            :disabled="disabled"
            label="Repeat password"
            type="password"
            maxlength="20"
            v-model="repeatedPassword"
            :rules="[repeatedPasswordRule]"
        ></v-text-field>
    </v-form>
</template>
<script lang="ts">
import { Vue, Component, Prop, Model, Watch } from 'vue-property-decorator'

@Component
export default class NameAndPass extends Vue {
    name = ''
    password = ''
    repeatedPassword = ''
    @Prop()
    disabled!: boolean
    @Model('update', { default: {} })
    value!: NameAndPass.Value

    @Watch('name')
    @Watch('password')
    emitUpdate() {
        this.$emit('update', {
            name: this.name,
            password: this.password
        })
    }

    @Watch('value')
    valueChanged() {
        this.name = this.value.name || ''
        this.password = this.value.password || ''
    }

    get valid() {
        const form = this.$refs.form as any
        return form.validate()
    }

    reset() {
        const form = this.$refs.form as any
        form.reset()
    }

    nameRule() {
        return (!!this.name && !!this.name.trim()) || 'Requires non-empty name'
    }

    nameLength() {
        return (
            (!!this.name &&
                !!this.name.trim() &&
                this.name.trim().length <= 20) ||
            `Wallet's name is longer than 20 characters`
        )
    }

    passwordRule() {
        return (
            (this.password && this.password.length >= 6) ||
            'Requires at least 6 characters'
        )
    }
    repeatedPasswordRule() {
        return this.repeatedPassword === this.password || 'Password mismatch'
    }
}
</script>
