<template>
    <DialogEx v-model="show" @action:cancel="show=false" max-width="500px">
        <v-card ref="card" flat>
            <v-card-text>
                <div class="subheading font-weight-light">Verify Password</div>
                <v-card flat>
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
                        <v-btn flat @click.stop="close">Cancel</v-btn>
                        <v-btn flat @click="onNext" color="error">Delete</v-btn>
                    </v-card-actions>
                </v-card>
            </v-card-text>
        </v-card>
    </DialogEx>
</template>
<script lang="ts">
    import { Vue, Component, Watch, Prop, Mixins } from 'vue-property-decorator'
    import { Keystore } from 'thor-devkit/dist/lib/crypto'
    import { Entities } from '@/renderer/database'
    import { cry } from 'thor-devkit'
    import AccountMixin from '@/renderer/mixins/Account'
    import DialogHelper from '@/renderer/mixins/dialog-helper'
import { setTimeout } from 'timers';
    @Component
    export default class DeleteWalletDialog extends Mixins(
        AccountMixin,
        class extends DialogHelper<Entities.Wallet, void> {}
    ) {
        password = ''
        show = false
        error: {
            isError: boolean
            messages: string[]
        } = {
            isError: false,
            messages: []
        }

        mounted() {
            this.show = true
            const ele = (this.$refs.card as Vue).$el.querySelector('input')
            setTimeout(()=> {
                ele!.focus()
            }, 0)
        }

        @Watch('show')
        showChanged(val: boolean) {
            if (!val) {
                this.result = null
            }
        }

        async onNext() {
            if (await this.checkPwd(this.password, this.arg.keystore)) {
                await this.deleteWallet()
            }
        }

        close() {
            this.show = false
        }

        async deleteWallet() {
            if (this.arg) {
                await BDB.wallets.delete(this.arg.id || 0)
                this.$router.push({ name: 'wallets' })
            }
        }
    }
</script>

