<template>
    <div>
        <v-text-field
            autofocus
            validate-on-blur
            label="Wallet name"
            v-model="name"
            :rules="[nameRule]"
        ></v-text-field>
        <v-text-field
            validate-on-blur
            label="Password"
            type="password"
            v-model="password"
            :rules="[passwordRule]"
        ></v-text-field>
        <v-text-field
            validate-on-blur
            label="Repeat password"
            type="password"
            v-model="repeatedPassword"
            :rules="[repeatedPasswordRule]"
        ></v-text-field>
    </div>
</template>
<script lang="ts">
    import { Vue, Component, Prop, Model, Watch } from 'vue-property-decorator'

    @Component
    export default class NameAndPass extends Vue {
        name = ''
        password = ''
        repeatedPassword = ''

        @Model('update', { default: {} })
        value!: NameAndPass.Value

        @Watch('name')
        @Watch('password')
        @Watch('repeatedPassword')
        emitUpdate() {
            this.$emit('update', {
                name: this.name,
                password: this.password,
                valid: this.valid
            })
        }

        @Watch('value')
        valueChanged() {
            this.name = this.value.name || ''
            this.password = this.value.password || ''
        }

        get valid() {
            return (
                this.nameRule() === true &&
                this.passwordRule() === true &&
                this.repeatedPasswordRule() === true
            )
        }

        created() {
            this.valueChanged()
        }

        nameRule() {
            return !!this.name && !!this.name.trim() || 'Requires non-empty name'
        }
        passwordRule() {
            return (
                (this.password && this.password.length <= 6) ||
                'Requires at least 6 characters'
            )
        }
        repeatedPasswordRule() {
            return this.repeatedPassword === this.password || 'Password not matched'
        }
    }
</script>
