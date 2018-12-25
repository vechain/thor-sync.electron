<template>
    <DialogEx v-model="show" @action:cancel="show=false" max-width="500px">
        <v-card ref="card" flat>
            <v-card-text>
                <div class="subheading font-weight-light">Verify Password</div>
                <form @submit.prevent="onNext">
                    <v-card flat>
                        <v-card-text>
                            <v-text-field
                                :error="error.isError"
                                :error-messages="error.messages"
                                type="password"
                                v-focus
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
                            <v-btn flat @click.stop="close">Cancel</v-btn>
                            <v-btn flat type="submit" color="error">Delete</v-btn>
                        </v-card-actions>
                    </v-card>
                </form>
            </v-card-text>
        </v-card>
    </DialogEx>
</template>
<script lang="ts">
    import { Vue, Component, Watch, Prop, Mixins } from 'vue-property-decorator'
    import { Entities } from '@/renderer/database'
    import { cry } from 'thor-devkit'
    import AccountMixin from '@/renderer/mixins/Account'
    import DialogHelper from '@/renderer/mixins/dialog-helper'
    import { setTimeout } from 'timers'
    @Component
    export default class DeleteWalletDialog extends Mixins(
        AccountMixin,
        class extends DialogHelper<Entities.Wallet, void> {}
    ) {
        password = ''
        show = false
        checking = false
        error: {
            isError: boolean
            messages: string[]
        } = {
            isError: false,
            messages: []
        }

        mounted() {
            this.show = true
        }

        @Watch('show')
        showChanged(val: boolean) {
            if (!val) {
                this.$resolve(undefined)
            }
        }

        async onNext() {
            this.checking = true
            if (await this.checkPwd(this.password, this.arg.keystore)) {
                await this.deleteWallet()
            }
            this.checking = false
        }

        close() {
            this.show = false
        }

        async deleteWallet() {
            if (this.arg) {
                await BDB.wallets.delete(this.arg.id || 0)
                this.close()
                BUS.$emit('wallet-deleted')
            }
        }
    }
</script>

