<template>
    <v-dialog v-model="show" v-bind="$attrs" v-on="$listeners" max-width="500px">
        <slot slot="activator" name="activator"/>
        <v-card flat>
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
                        <v-btn flat @click="checkPwd" color="error">Delete</v-btn>
                    </v-card-actions>
                </v-card>
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
    export default class DeleteWalletDialog extends Vue {
        @Prop()
        wallet!: Entities.Wallet
        password = ''
        show = false
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
            this.error = {
                isError: false,
                messages: []
            }
        }

        close() {
            this.show = false
        }
    
        async checkPwd() {
            const ks: Keystore | null = this.wallet!.keystore || null
            if (ks) {
                try {
                    await cry.Keystore.decrypt(ks, this.password)
                } catch (error) {
                    this.error.isError = true
                    this.error.messages = ['Password is invalid']
                    console.error(error)
                    return
                }

                await this.deleteWallet()
            }
        }

        async deleteWallet() {
            if (this.wallet) {
                await BDB.wallets.delete(this.wallet!.id || 0)
                this.$router.push({ name: 'wallets' })
            }
        }
    }
</script>

