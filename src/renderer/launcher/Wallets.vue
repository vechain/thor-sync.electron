<template>
    <v-layout column align-center>
        <v-layout column style="max-width:1000px;width:100%">
            <div>
                <v-layout justify-space-between px-3 pt-1 align-center>
                    <div>
                        <h2 class="ml-3 display-1">Wallets</h2>
                    </div>
                    <div>
                        <Tooltip bottom>
                            <v-btn slot="activator" icon flat @click="onCreate">
                                <v-icon>mdi-plus-circle-outline</v-icon>
                            </v-btn>
                            <span>Create</span>
                        </Tooltip>
                        <Tooltip bottom>
                            <v-btn slot="activator" flat icon @click="onImport">
                                <v-icon>mdi-download-outline</v-icon>
                            </v-btn>
                            <span>Import</span>
                        </Tooltip>
                        <v-btn flat @click="onLedger">
                            <SvgLedger width="75px" />
                        </v-btn>
                    </div>
                </v-layout>
            </div>
            <div class="pt-1">
                <div class="tabs pb-2 text-xs-center">
                    <span
                        :class="{active: currentTab === 'local'}"
                        @click="onTabChange('local')"
                        v-ripple
                        class="d-inline-block mx-2 pa-2 title gray text--dark-2 font-weight-regular"
                    >
                        Local
                        <span></span>
                    </span>
                    <span
                        :class="{active: currentTab === item.publicKey}"
                        @click="onTabChange(item.publicKey)"
                        v-ripple
                        class="d-inline-block mx-2 pa-2 title gray text--dark-2 font-weight-regular"
                        v-for="item in ledgers"
                        :key="item.publicKey"
                    >
                        {{item.name}}
                        <span></span>
                    </span>
                </div>
                <transition
                    mode="out-in"
                    :enter-active-class="`animated faster slide-in`"
                    :leave-active-class="`animated faster fade-out`"
                >
                    <router-view :key="$route.fullPath"></router-view>
                </transition>
            </div>
        </v-layout>
    </v-layout>
</template>
<script lang="ts">
import { Vue, Component, Watch } from 'vue-property-decorator'
import { cry } from 'thor-devkit'
import {
    ImportWalletDialog,
    CreateWalletDialog,
    ImportLedgerDialog
} from '@/renderer/components'

@Component
export default class Wallets extends Vue {
    show = true

    get ledgers() {
        return this.$store.getters.ledgerAccounts
    }

    onLoclaClick(address: string) {
        this.$router.push({
            name: 'wallet-detail',
            params: {
                type: 'local',
                addressOrCode: address
            }
        })
    }

    onLedgerClick(pubKey: string, index: number) {
        this.$router.push({
            name: 'wallet-detail',
            params: {
                type: 'ledger',
                addressOrCode: pubKey
            },
            query: {
                index: index.toString()
            }
        })
    }

    get currentTab() {
        return this.$route.params.group || 'local'
    }

    onImport() {
        this.$dialog(ImportWalletDialog, null)
    }

    onTabChange(key: string) {
        this.$router.replace({
            name: 'wallets-list',
            params: {
                group: key
            }
        })
    }

    onCreate() {
        this.$dialog(CreateWalletDialog, undefined)
    }

    onTransfer() {
        this.$router.push({ name: 'transfer' })
    }

    onLedger() {
        this.$dialog(ImportLedgerDialog, null)
    }

    @Watch('ledgers')
    onChange(v: any[], ov: any[]) {
        if (v.length !== ov.length) {
            const group = this.ledgers.length ? this.ledgers[this.ledgers.length - 1].publicKey : 'local'
            this.onTabChange(group)
        }
    }


}
</script>

<style scoped>
.tabs > span {
    position: relative;
    opacity: 0.7;
}
.tabs > span.active {
    opacity: 1;
}
.tabs span span {
    display: block;
    height: 2px;
    bottom: -2px;
    position: absolute;
    margin: auto;
    left: -8px;
    width: calc(100% + 16px);
}
.tabs span span::after {
    content: "";
    display: block;
    width: 0;
    opacity: 0;
    height: 100%;
    background-color: #1976d2;
    margin: auto;
    transition: all 0.2s ease-in-out;
}
.tabs span.active span::after {
    opacity: 0.87;
    width: 100%;
}
</style>
