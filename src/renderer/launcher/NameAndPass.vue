<template>
    <div>
        <v-text-field validate-on-blur label="Wallet name" v-model="name" :rules="[
                            nameRule]"></v-text-field>
        <v-text-field validate-on-blur label="Password" type="password" v-model="password" :rules="[
                            passwordRule]"></v-text-field>
        <v-text-field validate-on-blur label="Repeat password" type="password" v-model="repeatedPassword" :rules="[
                            repeatedPasswordRule]"></v-text-field>
    </div>
</template>
<script lang="ts">
import { Vue, Component, Prop, Model, Watch } from 'vue-property-decorator'

@Component
export default class NameAndPass extends Vue {
    @Model('change', { default: {} }) value !: NameAndPass.Value

    emitChange() {
        this.$emit('change', {
            name: this.name,
            password: this.password,
            valid: this.nameRule() === true &&
                this.passwordRule() === true &&
                this.repeatedPasswordRule() === true
        })
    }

    name = ""
    password = ""
    repeatedPassword = ""

    created() {
        this.name = this.value.name
        this.password = this.value.password
    }

    @Watch('name')
    nameChanged() { this.emitChange() }
    @Watch('password')
    passwordChanged() { this.emitChange() }
    @Watch('repeatedPassword')
    repeatedPasswordChanged() { this.emitChange() }
    @Watch('value')
    valueChanged() {
        this.name = this.value.name || ''
        this.password = this.value.password || ''
    }

    nameRule() { return !!this.name || 'Requires non-empty name' }
    passwordRule() { return this.password && this.password.length >= 6 || 'Requires at least 6 characters' }
    repeatedPasswordRule() { return this.repeatedPassword === this.password || 'Password not matched' }
}
</script>
