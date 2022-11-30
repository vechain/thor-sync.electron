<template>
    <v-list style="background: transparent">
        <v-list-tile v-for="(item, i) in connectStates" :key="i">
            <v-list-tile-content>
                <v-list-tile-title v-text="item.text"></v-list-tile-title>
            </v-list-tile-content>
            <v-list-tile-action>
                <template v-if="item.isChecked">
                    <v-icon
                        v-show="i <= status"
                        :class="item.isOk ? '': 'checkStatus'"
                        :color="item.isOk ? 'green' : 'blue'"
                    >{{item.isOk ? 'mdi-check' :'mdi-autorenew'}}</v-icon>
                </template>
                <v-icon v-else color="red">info</v-icon>
            </v-list-tile-action>
        </v-list-tile>
    </v-list>
</template>
<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import ledger from '@/common/ledger'
import Deferred from '@/common/deferred'
import { sleep } from '@/common/sleep'
@Component
export default class LedgerStatus extends Vue {
    @Prop(String)
    publicKey?: ''

    account: any = null
    signal = new Deferred<never>()

    get isCheck() {
        return !!this.publicKey
    }

    connectStatesDefault = [
        {
            text: '1. Connect and unlock your Ledger device',
            isOk: false
        },
        {
            text: '2. Navigate to the Dashboard',
            isOk: false
        },
        {
            text: '3. Navigate to VeChain app',
            isOk: false
        },
        {
            text: `4. ${this.isCheck ? 'Checking' : 'Getting'} account info`,
            isOk: false
        }
    ]

    status = 0
    updateTimer: any = null
    timeoutTimer: any = null

    public reset() {
        this.status = 0
        this.syncStatus()
    }

    async syncStatus() {
        for (; ;) {
            let tr
            try {
                try {
                    tr = await ledger.connect()
                    Vue.set(this, 'status', 2)
                } catch (error) {
                    LOG.info(error)
                    await Promise.race([sleep(2000), this.signal])
                    continue
                }

                const app = new ledger.App(tr as any)
                try {
                    this.account = await Promise.race([app.getAccount(ledger.path, false, true), this.signal])
                    Vue.set(this, 'status', 3)
                    if (this.account) {
                        this.$emit('deviceInfo', {
                            ...this.account,
                            product: ledger.connector.product()
                        })
                        Vue.set(this, 'status', 4)
                    }
                } catch (error) {
                    console.warn(error)
                    await Promise.race([sleep(2000), this.signal])
                    continue
                }

            } finally {
                tr && await tr.close().catch(() => { })
            }
            break
        }
    }

    get connectStates() {
        return this.connectStatesDefault.map((item, index) => {
            let isChecked = true
            if (this.isCheck && this.status === 4 && index === 3) {
                isChecked =
                    this.publicKey === (this.account && this.account.publicKey)
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
        await this.syncStatus()
        this.initTimeout()
    }

    beforeDestroy() {
        this.signal.reject(new Error('interrupted'))
        if (this.timeoutTimer) {
            clearTimeout(this.timeoutTimer)
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
