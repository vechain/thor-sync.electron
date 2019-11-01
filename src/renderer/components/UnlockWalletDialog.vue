<template>
    <DialogEx
        persistent
        v-model="opened"
        width="400"
        @action:ok="unlock"
        @action:cancel="opened=false"
    >
        <v-card>
            <v-card-title class="subheading">
                <v-layout align-center>
                    <v-icon class="mr-2">mdi-key</v-icon>Unlock Wallet
                </v-layout>
            </v-card-title>
            <v-card-text>
                <v-layout align-center mb-4>
                    <AddressLabel
                        class="mr-3"
                        icon
                        style="width:60px;height:40px;border-radius:5px"
                    >{{wallet.address}}</AddressLabel>
                    <v-layout column>
                        <div class="subheading text-truncate">{{wallet.name}}</div>
                        <AddressLabel abbrev class="caption">{{wallet.address}}</AddressLabel>
                    </v-layout>
                </v-layout>
                <v-text-field
                    v-focus
                    v-model="password"
                    type="password"
                    label="Password"
                    maxlength="20"
                    :error-messages="errorMessage"
                    @focus="errorMessage=''"
                    :disabled="processing"
                />
            </v-card-text>
            <v-divider/>
            <v-card-actions>
                <v-btn small flat @click="opened=false" :disabled="processing">Cancel</v-btn>
                <v-spacer/>
                <v-btn
                    small
                    :flat="!processing"
                    class="primary"
                    @click="unlock"
                    :disabled="processing"
                >Unlock</v-btn>
            </v-card-actions>
        </v-card>
    </DialogEx>
</template>
<script lang="ts">
import { Vue, Component, Prop, Mixins, Watch } from 'vue-property-decorator'
import DialogHelper from '@/renderer/mixins/dialog-helper'
import * as Keystore from '@/common/keystore'

type Arg = {
    wallet: entities.Wallet
}

@Component
export default class UnlockWalletDialog extends Mixins(
    class extends DialogHelper<Arg, Buffer | null> {}
) {
    opened = false
    password = ''
    errorMessage = ''

    processing = false
    get wallet() {
        return this.arg.wallet
    }

    @Watch('opened')
    openeChanged() {
        if (!this.opened) {
            this.$resolve(null)
        }
    }

    mounted() {
        this.opened = true
    }

    async unlock() {
        if (this.processing) {
            return
        }
        if (!this.password) {
            this.errorMessage = 'Input password here'
            return
        }
        this.processing = true
        try {
            const privateKey = await Keystore.decrypt(
                this.wallet.keystore,
                this.password
            )
            this.opened = false
            this.$resolve(privateKey)
        } catch (err) {
            this.errorMessage = 'Incorrect password'
        } finally {
            this.processing = false
        }
    }
}
</script>
