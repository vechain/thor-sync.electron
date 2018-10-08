<template>
    <v-app id="frame">
        <UIXRoot />
        <v-toolbar height="40px" dense flat class="sync-drag-zone" fixed app @dblclick="onDblClickTitleBar">
            <tab-bar @new-tab="onAddTAb" :current="current" @switch="onSwitchTab" :tabs="ports"
                @close="onTabRemove">
            </tab-bar>
            <NetworkStatus></NetworkStatus>
        </v-toolbar>
        <v-content class="sync-container">
            <search-bar flat light dense class="search-bar" v-if="ports.length">
                <AccountSwitch v-model="selectedAccount" @change="onAccountChange"></AccountSwitch>
            </search-bar>
            <view-port :address-bar="item.addressBar" :account="item.account" class="viewport-layout"
                :class="{current: item.id === current.value}" v-for="(item, index) in ports" :key="index"
                :url="item.src" @data-updated="onDataUpdated($event, index)" @status-update="onStatusUpdated($event, index)">
                <Launcher slot="content" @open-dapp="onOpenDappInCurrentPort($event, index)" v-if="!item.src"
                    class="default-content" path="/" />
            </view-port>
            <v-dialog>
                <v-card>
                    <v-container>
                        <v-layout>
                            <v-flex>
                                <v-select :items="[]"></v-select>
                            </v-flex>
                        </v-layout>
                    </v-container>
                    <v-card-actions>
                        <v-spacer></v-spacer>
                        <v-btn>
                            cancel
                        </v-btn>
                        <v-btn>
                            ok
                        </v-btn>
                    </v-card-actions>
                </v-card>
            </v-dialog>
        </v-content>
    </v-app>
</template>
<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

import TabBar from './components/TabBar.vue'
import ViewPort from './components/ViewPort.vue'
import NetworkStatus from './components/NetworkStatus.vue'
import AccountSwitch from './components/AccountSwitch.vue'
import { remote } from 'electron'
import Launcher from './launcher'
import SearchBar from './components/SearchBar.vue'
import UIXRoot from './components/UIXRoot.vue'

type PortTab = TabBar.Item & {
    id: number
    addressBar: boolean
    account?: string
}
type Current = {
    key: string
    value: string | number
}

@Component({
    components: {
        TabBar,
        ViewPort,
        NetworkStatus,
        AccountSwitch,
        Launcher,
        SearchBar,
        UIXRoot
    }
})
export default class Nova extends Vue {
    selectedAccount: string | null = null
    private counter: number = 0
    private ports: PortTab[] = []
    private current: Current = {
        key: 'id',
        value: 0
    }
    private search?: string = ''
    private apps: object[] = []
    private accounts: any[] = []

    public getAccounts() {
        return WALLETS.list().then(list => {
            this.accounts = list
        })
    }

    // get currentAccount() {
    //     const currentPort = this.ports.find(item => {
    //         return item.id === this.current.value
    //     })
    //     return currentPort!.account
    // }
    created() {
        this.getAccounts()
        BUS.$on('open-dapp', (data: any) => {
            this.onOpenDapp(data)
        })
    }
    public onOpenDapp(app: PortTab) {
        let item: PortTab = {
            title: app.title,
            iconUrl: '',
            id: Date.now() + this.counter,
            src: app.src,
            status: 'new',
            addressBar: app.addressBar
            // account: app.account || this.accounts[0]['address']
        }
        this.current.value = item.id
        ++this.counter
        // this.ports.set(item.id, item)
        this.ports.push(item)
    }

    public onOpenDappInCurrentPort(
        app: Dapp.Item & { addressBar: boolean; account: string },
        index: number
    ) {
        this.$set(this.ports[index], 'src', app.src)
        this.$set(this.ports[index], 'title', app.name)
        this.$set(this.ports[index], 'addressBar', app.addressBar)
        // this.$set(
        //     this.ports[index],
        //     'account',
        //     app.account || this.accounts[0]['address']
        // )
    }
    public onAccountChange(addr: string) {
        const index = this.ports.findIndex(item => {
            return item.id === this.current.value
        })
        this.$set(this.ports[index], 'account', addr)
    }
    public onAddTAb() {
        let item: PortTab = {
            title: 'New tab',
            iconUrl: '',
            id: Date.now() + this.counter,
            src: '',
            status: 'new',
            account: '',
            addressBar: true
        }
        ++this.counter
        this.current.value = item.id
        this.ports.push(item)
        this.selectedAccount = null
    }

    public onTabRemove(tab: PortTab) {
        let index = this.ports.findIndex(item => {
            return item.id === tab.id
        })
        this.ports.splice(index, 1)
        if (this.ports[this.ports.length - 1]) {
            this.selectedAccount = this.ports[this.ports.length - 1]['account'] || null
            this.current.value = this.ports[this.ports.length - 1]['id']
        } else {
            this.selectedAccount = null
            this.current.value = ''
        }
    }

    public onSwitchTab(item: PortTab) {
        this.current.value = item.id
        const currentItem = this.ports.find(item => {
            return this.current.value === item.id
        })
        this.selectedAccount = currentItem
            ? currentItem.account
                ? currentItem.account
                : null
            : null
    }

    public onDataUpdated(event: ViewPort.DataUpdateEvent, index: number) {
        let type = event.type
        let value = event.value
        if (type === 'title') {
            this.$set(this.ports[index], 'title', value)
        } else if (type === 'icon') {
            this.$set(this.ports[index], 'iconUrl', value)
        } else {
        }
    }

    public onStatusUpdated(event: ViewPort.StatusUpdateEvent, index: number) {
        this.$set(this.ports[index], 'status', event.status)
    }

    onDblClickTitleBar() {
        const action = (() => {
            if (process.platform === 'darwin') {
                return remote.systemPreferences.getUserDefault(
                    'AppleActionOnDoubleClick',
                    'string'
                ) as string
            }
        })()
        const win = remote.getCurrentWindow()
        switch (action) {
            case 'Minimize':
                remote.app.xWorker.minimizeWindow(win.id)
                break
            case 'None':
                break
            default:
                if (win.isMaximized()) {
                    remote.app.xWorker.unmaximizeWindow(win.id)
                } else {
                    remote.app.xWorker.maximizeWindow(win.id)
                }
        }
    }
}
</script>

<style lang="scss">
html {
    overflow-y: auto; // vuetify will set this value to 'scroll', overwrite it
}
body {
    background: #fff;
    height: 100vh;
    width: 100vw;
}
#app {
    font-family: 'Avenir', Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    text-align: center;
    color: #2c3e50;
    height: 100%;
    width: 100%;
}
.sync-drag-zone {
    -webkit-app-region: drag;
}

.search-bar {
    position: absolute;
    top: 0;
    z-index: 2;
    background-color: #fff;
}

.sync-container .viewport-layout {
    position: absolute;
    top: 48px;
    height: calc(100% - 48px);
}

.sync-dapp-list.default-content {
    width: 75%;
    max-width: 1000px;
    margin: 50px auto;
}
.sync-dapp-list.default-content .search {
    margin: 50px auto 50px;
    width: 70%;
}
.tab-tools {
    float: right;
}
.sync-viewport-container {
    visibility: hidden;
    z-index: 0;
}
.sync-viewport-container.current {
    visibility: visible;
    z-index: 2;
}
</style>
