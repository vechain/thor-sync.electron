<template>
    <DialogEx persistent v-model="show" @action:ok="onOk" @action:cancel="show=false" max-width="400px">
        <v-card>
            <v-card-title class="subheading">Delete Wallet</v-card-title>
            <v-card-text>
                <div>
                    This action
                    <strong>CANNOT </strong>be undone. Unless you have backed up your wallet beforehand, your wallet will be
                    <strong>PERMANENTLY </strong>deleted.
                </div>
                <br>
                <v-text-field
                    :error="error.isError"
                    :error-messages="error.messages"
                    type="text"
                    v-focus
                    placeholder="Please type in the name of the wallet to confirm"
                    label="Wallet Name"
                    v-model="name"
                    :loading="checking"
                ></v-text-field>
            </v-card-text>
            <v-divider/>
            <v-card-actions>
                <v-btn small flat @click.stop="close">Abort</v-btn>
                <v-spacer></v-spacer>
                <v-btn small ref="submit" flat type="button" @click="onNext" class="error">Delete this wallet</v-btn>
            </v-card-actions>
        </v-card>
    </DialogEx>
</template>
<script lang="ts">
import { Vue, Component, Watch, Prop, Mixins } from 'vue-property-decorator'
import { cry } from 'thor-devkit'
import AccountMixin from '@/renderer/mixins/Account'
import DialogHelper from '@/renderer/mixins/dialog-helper'
import { setTimeout } from 'timers'

type Arg = {
    name: string
    id?: number
}
@Component
export default class DeleteWalletDialog extends Mixins(
    class extends DialogHelper<Arg, void> {}
) {
    name = ''
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

    checkName() {
        if (this.name === this.arg.name) {
            this.error.isError = false
            this.error.messages = []
            return true
        } else {
            this.error.isError = true
            this.error.messages = ['Invalid wallet name']
            return false
        }
    }

    async onNext() {
        this.checking = true
        if (this.checkName()) {
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
        }
    }

    onOk() {
        const btn = (this.$refs.submit as Vue).$el
        btn.focus()
        btn.click()
    }
}
</script>

