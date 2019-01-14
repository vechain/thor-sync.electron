<template>
    <DialogEx v-model="show" @action:ok="onNext" @action:cancel="show=false" max-width="500px">
        <v-card ref="card">
            <v-card-title class="subheading">Reset Password</v-card-title>
            <v-card-text>
                <v-stepper class="elevation-0" v-model="step">
                    <v-stepper-header class="elevation-0">
                        <v-stepper-step :complete="step > 1" step="1"></v-stepper-step>
                        <v-divider></v-divider>
                        <v-stepper-step :complete="step > 2" step="2"></v-stepper-step>
                    </v-stepper-header>
                    <div
                        class="title font-weight-light pl-4"
                    >{{[`Please enter your wallet password`, 'Please enter your new password'][step-1]}}</div>
                    <v-stepper-items>
                        <v-stepper-content step="1">
                            <v-text-field
                                v-focus
                                :error="error.isError"
                                :error-messages="error.messages"
                                type="password"
                                label="Password"
                                @change="pwdChanged"
                                v-model="password"
                                :loading="checking"
                            >
                                <v-progress-linear
                                    v-if="checking"
                                    slot="progress"
                                    indeterminate
                                    height="2"
                                ></v-progress-linear>
                            </v-text-field>
                        </v-stepper-content>
                        <v-stepper-content step="2">
                            <v-form ref="form">
                                <v-text-field
                                    validate-on-blur
                                    :rules="[passwordRule]"
                                    type="password"
                                    label="New Password"
                                    v-model="newPassword"
                                ></v-text-field>
                                <v-text-field
                                    validate-on-blur
                                    :rules="[repeatedPasswordRule]"
                                    label="Repeat Password"
                                    type="password"
                                    v-model="repeatedPassword"
                                ></v-text-field>
                            </v-form>
                        </v-stepper-content>
                    </v-stepper-items>
                </v-stepper>
            </v-card-text>
            <v-divider/>
            <v-card-actions>
                <v-btn small flat @click="close">Abort</v-btn>
                <v-spacer></v-spacer>
                <v-btn
                    small
                    flat
                    @click="onNext"
                    color="primary"
                >{{ this.step === 1 ? 'Next' : 'Save'}}</v-btn>
            </v-card-actions>
        </v-card>
    </DialogEx>
</template>
<script lang="ts">
    import { Vue, Component, Watch, Prop, Mixins } from 'vue-property-decorator'
    import { cry } from 'thor-devkit'
    import DialogHelper from '@/renderer/mixins/dialog-helper'
    import Account from '@/renderer/mixins/Account'

    @Component
    export default class ResetPwdDialog extends Mixins(
        Account,
        class extends DialogHelper<entities.Wallet, void> {}
    ) {
        show = false
        checking = false
        password = ''
        newPassword = ''
        repeatedPassword = ''
        step = 1
        privateKey: Buffer | null = null
        // error: {
        //     isError: boolean
        //     messages: string[]
        // } = {
        //     isError: false,
        //     messages: []
        // }

        @Watch('show')
        showChanged(val: boolean) {
            if (!val) {
                this.$resolve(undefined)
            }
        }

        mounted() {
            this.show = true
        }

        close() {
            this.show = false
        }

        requirePwd() {
            return this.newPassword.trim() || 'Requires non-empty password'
        }

        passwordRule() {
            return (
                (this.newPassword && this.newPassword.length >= 6) ||
                'Requires at least 6 characters'
            )
        }
        repeatedPasswordRule() {
            return this.repeatedPassword === this.newPassword || 'Password mismatch'
        }
        async onNext() {
            console.log(1)
            if (this.step === 1) {
                this.checking = true
                this.privateKey =
                    (await this.checkPwd(this.password, this.arg.keystore)) || null
                if (this.privateKey) {
                    this.step = 2
                }
                this.checking = false
            } else {
                await this.resetPwd()
            }
        }

        get valid() {
            return (
                this.passwordRule() === true && this.repeatedPasswordRule() === true
            )
        }

        async resetPwd() {
            if (!(this.$refs.form as any).validate()) {
                return
            }
            if (this.privateKey && this.arg.id) {
                const ks = await cry.Keystore.encrypt(
                    this.privateKey,
                    this.newPassword
                )
                BDB.wallets
                    .where('id')
                    .equals(this.arg.id)
                    .modify({ keystore: ks })

                this.close()
            }
        }
    }
</script>
