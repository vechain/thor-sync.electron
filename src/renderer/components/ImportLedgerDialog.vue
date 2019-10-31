<template>
    <DialogEx persistent @action:ok="onOk" v-model="show" @action:cancel="abort" max-width="600px">
        <slot slot="activator" name="activator" />
        <v-card>
            <v-card-title class="subheading">Import Ledger</v-card-title>
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
                            <v-form v-if="step === 2" ref="form" v-model="valid" @submit.prevent>
                                <v-text-field
                                    v-model="deviceName"
                                    validate-on-blur
                                    v-focus
                                    :counter="20"
                                    :rules="nameRules"
                                    label="Device name"
                                    required
                                ></v-text-field>
                                <v-checkbox
                                    v-if="isHave"
                                    :ripple="false"
                                    @change="overWriteCheck"
                                    :error-messages="overWriteErrorMsg"
                                    persistent-hint
                                    color="warning"
                                    v-model="overWrite"
                                    :disabled="processing"
                                >
                                    <span
                                        slot="label"
                                        class="warning--text"
                                    >The device already existed. I agree to overwrite the device name.</span>
                                </v-checkbox>
                            </v-form>
                            <v-list style="background: transparent" class="py-0" two-line>
                                <template v-for="(item, i) in accountList">
                                    <v-list-tile avatar :key="i+'item'">
                                        <v-list-tile-avatar>
                                            <IdentBox
                                                style="width: 40px; height: 40px; border-radius: 3px"
                                                :text="item.toLowerCase()"
                                            />
                                        </v-list-tile-avatar>
                                        <v-list-tile-content>
                                            <v-list-tile-title>{{(deviceName || 'Account') | ledgerName(i)}}</v-list-tile-title>
                                            <v-list-tile-sub-title
                                                style="font-family: 'Roboto Mono', monospace; font-size: 95%;"
                                                class="caption"
                                            >{{ item | checksum}}</v-list-tile-sub-title>
                                        </v-list-tile-content>
                                    </v-list-tile>
                                    <v-divider v-if="i !== 4" :key="i+'divider'" :inset="true"></v-divider>
                                </template>
                            </v-list>
                        </v-stepper-content>
                    </v-stepper-items>
                </v-stepper>
            </v-card-text>
            <v-divider />
            <v-card-actions>
                <v-btn small :disabled="processing" flat @click.stop="abort">Abort</v-btn>
                <v-spacer />
                <v-btn
                    v-show="step === 2"
                    :disabled="processing || (isHave && !overWrite)"
                    small
                    ref="import"
                    @click="onImport"
                    :flat="!processing"
                    class="primary"
                >Import</v-btn>
            </v-card-actions>
        </v-card>
    </DialogEx>
</template>

<script lang="ts">
import { Vue, Component, Mixins, Watch } from 'vue-property-decorator'
import DialogHelper from '@/renderer/mixins/dialog-helper'
import { cry } from 'thor-devkit'

type deviceInfos = {
    publicKey: string
    address: string
    chainCode: string
    product: string
}

@Component
export default class ImportLedgerDialog extends Mixins(
    class extends DialogHelper<any, void> { }
) {
    processing: boolean = false
    step = 1
    show = false
    deviceInfo: deviceInfos | null = null
    deviceName = ''
    overWrite = false
    overWriteErrorMsg: string[] = []

    nameRules = [
        (v: string) => !!v || 'Device name is required',
        (v: string) => v.length <= 20 || 'Device name must be less than 20 characters'
    ]

    valid = true

    @Watch('show')
    valueUpdate(val: boolean) {
        if (!this.show) {
            this.$resolve(undefined)
        }
    }

    overWriteCheck() {
        if (this.isHave) {
            this.overWriteErrorMsg = !this.overWrite
                ? ['Please check the box to proceed']
                : []
            return this.overWrite
        } else {
            return true
        }
    }

    async onImport() {
        const form = this.$refs.form as any
        const owV = this.overWriteCheck()
        if (!form.validate() && owV) {
            return
        }
        if (this.processing) {
            return
        }
        this.processing = true
        try {
            if (this.overWrite) {
                await LDDB.devices.where('chainCode')
                    .equals(this.deviceInfo!.chainCode)
                    .modify({ name: this.deviceName })
            } else {
                await LDDB.devices.add({
                    publicKey: this.deviceInfo!.publicKey,
                    product: this.deviceInfo!.product,
                    name: this.deviceName,
                    chainCode: this.deviceInfo!.chainCode
                })
            }
        } catch (error) {
            LOG.error(error)
        } finally {
            this.processing = false
            this.show = false
        }
    }

    get accountList() {
        const accounts: string[] = []
        if (!this.deviceInfo) {
            return accounts
        }
        const pub = Buffer.from(this.deviceInfo!.publicKey, 'hex')
        const chainCode = Buffer.from(this.deviceInfo!.chainCode, 'hex')
        const hdNode = cry.HDNode.fromPublicKey(pub, chainCode)
        for (let i = 0; i < 5; i++) {
            accounts.push(hdNode.derive(i).address)
        }

        return accounts
    }

    get isHave() {
        if (this.deviceInfo && this.$store.state.ledgers && this.$store.state.ledgers.length) {
            return this.$store.state.ledgers.map((item: entities.LedgerDevice) => {
                return item.publicKey
            }).indexOf(this.deviceInfo.publicKey) >= 0
        } else {
            return false
        }
    }
    mounted() {
        this.show = true
    }
    onOk(e: Event) {
        const el = (this.$refs.import as Vue).$el
        el.focus()
        el.click()
    }
    onGetDeviceInfo(deviceInfo: deviceInfos) {
        this.deviceInfo = deviceInfo
        setTimeout(() => {
            this.step = 2
        }, 1000)
    }
    abort() {
        this.show = false
    }
}
</script>
