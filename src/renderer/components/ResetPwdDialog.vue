<template>
    <DialogEx v-model="show" @action:cancel="show=false" max-width="500px">
        <v-card ref="card">
            <v-card-text>
                <div class="subheading font-weight-light">Reset Password</div>
                <v-stepper class="elevation-0" v-model="step">
                    <v-stepper-header class="elevation-0">
                        <v-stepper-step :complete="step > 1" step="1"></v-stepper-step>
                        <v-divider></v-divider>
                        <v-stepper-step :complete="step > 2" step="2"></v-stepper-step>
                    </v-stepper-header>
                    <div
                        class="title font-weight-light pl-4"
                    >{{['Verify Password', 'Reset Password'][step-1]}}</div>
                    <v-stepper-items>
                        <v-stepper-content step="1">
                            <v-form @submit.prevent="onNext">
                                <v-card>
                                    <v-card-text>
                                        <v-text-field
                                            :autofocus="true"
                                            :error="error.isError"
                                            :error-messages="error.messages"
                                            type="password"
                                            label="Password"
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
                                    </v-card-text>
                                    <v-card-actions>
                                        <v-spacer></v-spacer>
                                        <v-btn flat @click="close">Cancel</v-btn>
                                        <v-btn flat type="submit" color="primary">Next</v-btn>
                                    </v-card-actions>
                                </v-card>
                            </v-form>
                        </v-stepper-content>
                        <v-stepper-content step="2">
                            <v-form ref="form" @submit.prevent="resetPwd">
                                <v-card>
                                    <v-card-text>
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
                                    </v-card-text>
                                    <v-card-actions>
                                        <v-spacer></v-spacer>
                                        <v-btn flat @click="close">Cancel</v-btn>
                                        <v-btn flat type="submit" color="primary">Save</v-btn>
                                    </v-card-actions>
                                </v-card>
                            </v-form>
                        </v-stepper-content>
                    </v-stepper-items>
                </v-stepper>
            </v-card-text>
        </v-card>
    </DialogEx>
</template>
<script lang="ts">
    import { Vue, Component, Watch, Prop, Mixins } from 'vue-property-decorator'
    import { Keystore } from 'thor-devkit/dist/lib/crypto'
    import { Entities } from '@/renderer/database'
    import { cry } from 'thor-devkit'
    import DialogHelper from '@/renderer/mixins/dialog-helper'
    import Account from '@/renderer/mixins/Account'

    @Component
    export default class ResetPwdDialog extends Mixins(
        Account,
        class extends DialogHelper<Entities.Wallet, void> {}
    ) {
        @Prop()
        wallet!: Entities.Wallet
        show = false
        checking = false
        password = ''
        newPassword = ''
        repeatedPassword = ''
        step = 1
        privateKey: Buffer | null = null
        error: {
            isError: boolean
            messages: string[]
        } = {
            isError: false,
            messages: []
        }

        @Watch('show')
        showChanged(val: boolean) {
            if (!val) {
                // this.reset()
                this.result = null
            }
        }

        mounted() {
            this.show = true
        }

        close() {
            this.show = false
        }

        requirePwd() {
            return this.password || 'Requires non-empty password'
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
        async onNext() {
            this.checking = true
            this.privateKey =
                (await this.checkPwd(this.password, this.arg.keystore)) || null
            if (this.privateKey) {
                this.step = 2
            }
            this.checking = false
        }

        get valid() {
            return (
                this.passwordRule() === true && this.repeatedPasswordRule() === true
            )
        }

        async resetPwd() {
            // this.$refs.form.validate()
            if (!(this.$refs.form as any).validate()) {
                return
            }
            if (this.privateKey && this.wallet.id) {
                const ks = await cry.Keystore.encrypt(
                    this.privateKey,
                    this.newPassword
                )
                BDB.wallets
                    .where('id')
                    .equals(this.wallet.id)
                    .modify({ keystore: ks })

                this.close()
            }
        }
    }
</script>
