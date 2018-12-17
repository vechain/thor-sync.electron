<template>
    <v-dialog v-model="show" v-bind="$attrs" v-on="$listeners" max-width="500px">
        <slot slot="activator" name="activator"/>
        <v-card>
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
                            <v-card>
                                <v-card-text>
                                    <v-text-field
                                        :error="error.isError"
                                        :error-messages="error.messages"
                                        type="password"
                                        label="Password"
                                        v-model="password"
                                    ></v-text-field>
                                </v-card-text>
                                <v-card-actions>
                                    <v-spacer></v-spacer>
                                    <v-btn flat @click="close">Cancel</v-btn>
                                    <v-btn flat @click="checkPwd" color="primary">Next</v-btn>
                                </v-card-actions>
                            </v-card>
                        </v-stepper-content>
                        <v-stepper-content step="2">
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
                                    <v-btn flat @click="resetPwd" color="primary">Save</v-btn>
                                </v-card-actions>
                            </v-card>
                        </v-stepper-content>
                    </v-stepper-items>
                </v-stepper>
            </v-card-text>
        </v-card>
    </v-dialog>
</template>
<script lang="ts">
    import { Vue, Component, Watch, Prop } from 'vue-property-decorator'
    import { Keystore } from 'thor-devkit/dist/lib/crypto'
    import { Entities } from '@/renderer/database'
    import { cry } from 'thor-devkit'
    @Component
    export default class ResetPwdDialog extends Vue {
        @Prop()
        wallet!: Entities.Wallet
        show = false
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
                this.reset()
            }
        }

        reset() {
            this.password = ''
            this.newPassword = ''
            this.repeatedPassword = ''
            this.step = 1
            this.error = {
                isError: false,
                messages: []
            }
        }

        close() {
            this.show = false
        }

        passwordRule() {
            return (
                (this.password && this.password.length >= 6) ||
                'Requires at least 6 characters'
            )
        }
        repeatedPasswordRule() {
            return this.repeatedPassword === this.password || 'Password not matched'
        }

        async checkPwd() {
            const ks: Keystore | null = this.wallet!.keystore || null
            if (ks) {
                try {
                    this.privateKey = await cry.Keystore.decrypt(ks, this.password)
                } catch (error) {
                    this.error.isError = true
                    this.error.messages = ['Password is invalid']
                    console.error(error)
                    return
                }
                this.step = 2
            }
        }

        get valid() {
            return (
                this.passwordRule() === true && this.repeatedPasswordRule() === true
            )
        }

        async resetPwd() {
            if (!this.valid) {
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
