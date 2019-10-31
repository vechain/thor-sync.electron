<template>
    <v-list style="background: transparent">
        <v-list-tile v-for="(item, i) in connectStates" :key="i">
            <v-list-tile-content>
                <v-list-tile-title v-text="item.text"></v-list-tile-title>
            </v-list-tile-content>
            <v-list-tile-action>
                <v-icon
                    v-if="item.isChecked"
                    :class="item.isOk ? '': 'checkStatus'"
                    :color="item.isOk ? 'green' : 'blue'"
                >{{item.isOk ? 'mdi-check' :'mdi-autorenew'}}</v-icon>
                <v-icon v-else color="red">info</v-icon>
            </v-list-tile-action>
        </v-list-tile>
    </v-list>
</template>
<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import ledger from '@/common/ledger'
import { UsbMonitor } from '@vechain/usb-monitor'
import { stat } from 'fs'
@Component
export default class LedgerStatus extends Vue {
    @Prop(String)
    publicKey?: ''

    account: any = null

    get isCheck() {
        return !!this.publicKey
    }

    connectStatesDefault = [{
        text: '1. Connect and unlock your Ledger device',
        isOk: false
    }, {
        text: '2. Navigate to the Dashboard',
        isOk: false
    }, {
        text: '3. Navigate to VeChain app',
        isOk: false
    }, {
        text: `4. ${this.isCheck ? 'Checking' : 'Getting'} account info`,
        isOk: false
    }]

    status = 0
    usbM: UsbMonitor | null = ledger.getUsbM()
    updateTimer: any = null
    timeoutTimer: any = null

    public reset() {
        this.status = 0
        this.syncStatus()
    }

    async syncStatus() {
        if (this.updateTimer) {
            clearTimeout(this.updateTimer)
            this.updateTimer = null
        }
        let status = ledger.getStatus()
        let device: any
        if (status === 2) {
            device = ledger.getDevice()
            if (device) {
                try {
                    this.account = await ledger.getAccount()
                    status = 3
                } catch (error) {
                    LOG.info(error)
                }
            }

            if (this.account) {
                status = 4
            }
        }
        if (status < 2) {
            this.updateTimer = setTimeout(() => {
                Vue.set(this, 'status', status)
            }, 1000)
        } else {
            if (this.account) {
                this.$emit('deviceInfo', { ...this.account, product: device!.product })
            }
            Vue.set(this, 'status', status)
        }

    }

    get connectStates() {
        return this.connectStatesDefault.map((item, index) => {
            let isChecked = true
            if (this.isCheck && this.status === 4 && index === 3) {
                isChecked = this.publicKey === (this.account && this.account.publicKey)
            }
            return {
                text: item.text,
                isOk: index < this.status,
                isChecked: isChecked
            }
        })
    }

    @Watch('status')
    onStatusChanged(v: number) {
        clearTimeout(this.timeoutTimer)
        if (v !== 4) {
            this.initTimeout()
        }
    }

    initTimeout() {
        this.timeoutTimer = setTimeout(() => {
            if (this.status < 4) {
                this.$emit('timeout')
            }
        }, 30000)
    }

    async mounted() {
        this.usbM!.on('change', this.syncStatus)
        await this.syncStatus()
        this.initTimeout()
    }

    beforeDestroy() {
        this.usbM!.removeListener('change', this.syncStatus)
        if (this.timeoutTimer) {
            clearTimeout(this.timeoutTimer)
        }
        if (this.updateTimer) {
            clearTimeout(this.updateTimer)
        }
    }
}
</script>
<style scoped>
.checkStatus::before {
    animation: spinAround 1s infinite linear;
}
@keyframes spinAround {
    from {
        transform: rotate(0);
    }

    to {
        transform: rotate(359deg);
    }
}
</style>
