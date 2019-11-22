<template>
    <DialogEx
        persistent
        v-model="show"
        @action:ok="onOk"
        @action:cancel="show=false"
        max-width="650px"
    >
        <v-card>
            <v-card-title class="subheading">Display Ladger Address</v-card-title>
            <v-card-text class="pt-0">
                <v-stepper
                    style="max-height: 400px;overflow: auto;"
                    class="elevation-0"
                    v-model="step"
                >
                    <v-stepper-header class="elevation-0" v-show="false">
                        <v-stepper-step :complete="step > 1" step="1"></v-stepper-step>
                        <v-divider />
                        <v-stepper-step :complete="step > 2" step="2"></v-stepper-step>
                    </v-stepper-header>
                    <v-stepper-items>
                        <v-stepper-content step="1">
                            <div
                                class="title font-weight-light pl-4 pt-4"
                            >Please Launch VeChain application on your Ledger</div>
                            <LedgerStatus @deviceInfo="onGetDeviceInfo" />
                        </v-stepper-content>
                        <v-stepper-content step="2">
                            <div
                                class="title font-weight-light pl-4 pt-4 mb-4"
                            >Please verify that the vechain address shown on Screen matches on your ledger device</div>
                            <v-layout align-center justify-center>
                                <AddressLabel
                                    class="mr-3"
                                    style="width:75px;height:50px;border-radius:5px"
                                    icon
                                >{{arg.address}}</AddressLabel>
                                <div>
                                    <v-layout align-center>
                                        <span class="headline">{{arg.name}}</span>
                                    </v-layout>
                                    <v-layout align-center>
                                        <AddressLabel style="font-size:95%">{{arg.address}}</AddressLabel>
                                    </v-layout>
                                </div>
                            </v-layout>
                        </v-stepper-content>
                    </v-stepper-items>
                </v-stepper>
            </v-card-text>
            <v-divider />
            <v-card-actions>
                <v-btn small flat @click.stop="close">Abort</v-btn>
                <v-spacer />
                <v-btn v-show="step === 2" small @click.stop="close" class="primary">OK</v-btn>
            </v-card-actions>
        </v-card>
    </DialogEx>
</template>
<script lang="ts">
import { Vue, Component, Mixins, Watch } from 'vue-property-decorator'
import DialogHelper from '@/renderer/mixins/dialog-helper'
import ledger from '@/common/ledger'
type arg = {
    name: string
    address: string
}
@Component
export default class ShowLedgerAddressDialog extends Mixins(
    class extends DialogHelper<arg, void> { }
) {
    step = 1
    show = false

    @Watch('show')
    valueUpdate(val: boolean) {
        if (!this.show) {
            this.$resolve(undefined)
        }
    }
    mounted() {
        this.show = true
    }

    get addressIndex() {
        return parseInt(this.arg.name.substr(this.arg.name.length - 1, this.arg.name.length), 10) - 1
    }

    async onGetDeviceInfo() {
        this.step = 2
        try {
          await ledger.showAccount(this.addressIndex)
        } catch (error) {
          LOG.error(error)
        } finally {
          this.close()
        }

    }
    onOk() {
        this.show = false
    }

    close() {
        this.show = false
    }
}
</script>
