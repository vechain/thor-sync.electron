<template>
    <DialogEx
        persistent
        v-model="show"
        @action:ok="onOk"
        @action:cancel="show=false"
        max-width="450px"
    >
        <v-card>
            <v-card-title class="subheading">Delete Wallet</v-card-title>
            <v-card-text>
                <p>
                    This action
                    <strong>CANNOT</strong> be undone. Unless you have backed up your wallet beforehand, your wallet will be
                    <strong>PERMANENTLY</strong> deleted.
                </p>
                <v-text-field
                    ref="nameInput"
                    type="text"
                    v-focus
                    validate-on-blur
                    placeholder="Please type the wallet name to confirm"
                    label="Wallet Name"
                    v-model="name"
                    :rules="[checkName]"
                    :loading="checking"
                ></v-text-field>
            </v-card-text>
            <v-divider/>
            <v-card-actions>
                <v-btn small flat @click.stop="close">Abort</v-btn>
                <v-spacer></v-spacer>
                <v-btn
                    small
                    ref="submit"
                    flat
                    type="button"
                    @click="onNext"
                    class="error"
                    :disabled="checking"
                >Delete this wallet</v-btn>
            </v-card-actions>
        </v-card>
    </DialogEx>
</template>
<script lang="ts">
import { Vue, Component, Watch, Prop, Mixins } from 'vue-property-decorator'
import { cry } from 'thor-devkit'
import DialogHelper from '@/renderer/mixins/dialog-helper'

type Arg = {
    name: string
    id?: number
}
@Component
export default class DeleteWalletDialog extends Mixins(
    class extends DialogHelper<Arg, void> { }
) {
    name = ''
    show = false
    checking = false

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
            return true
        } else {
            return 'Invalid wallet name'
        }
    }

    async onNext() {
        this.checking = true
        const filed = this.$refs.nameInput as any

        if (filed.validate()) {
            await this.deleteWallet()
            this.close()
        }
        this.checking = false
    }

    close() {
        this.show = false
    }

    async deleteWallet() {
        if (this.arg) {
            await BDB.wallets.delete(this.arg.id || 0)
        }
    }

    onOk() {
        const btn = (this.$refs.submit as Vue).$el
        btn.focus()
        btn.click()
    }
}
</script>

