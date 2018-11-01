<template>
    <v-app id="frame">
        <Vendor/>
        <v-toolbar
            color="grey lighten-3"
            height="40px"
            class="drag-zone elevation-0"
            style="overflow:hidden;"
            fixed
            app
            @dblclick="onDblClickTitleBar"
        >
            <transition-group
                key="a"
                name="list-complete"
                tag="v-layout"
                class="tab-group"
                style=""
            >
                <TabButton
                    v-for="(item,i) in items"
                    style="flex: 0 1 auto;width:200px;-webkit-app-region: no-drag;"
                    :key="tabs[i].id"
                    :value="item"
                    @close="closeTab(i)"
                    @click.native="clickTab(i)"
                    @dblclick.native.stop
                />
                <v-btn
                    flat
                    small
                    :ripple="false"
                    key="the-add-btn"
                    @click="onAddTAb"
                    @dblclick.native.stop
                    class="ma-1 pa-0 ml-2"
                    style="-webkit-app-region: no-drag;width:auto;height:auto;min-width:auto;"
                >
                    <v-icon style="font-size:150%">add</v-icon>
                </v-btn>
            </transition-group>
            <v-spacer/>
            <NetworkStatus style="-webkit-app-region: no-drag"></NetworkStatus>
            <TxRecordsPanel style="-webkit-app-region: no-drag"/>
        </v-toolbar>
        <v-content class="sync-container">
            <view-port
                class="viewport-layout"
                v-for="(item, index) in tabs"
                :key="item.id"
                :class="{current: currentIndex === index}"
                :opt="item"
                @data-updated="onDataUpdate($event, index)"
                @status-updated="onStatusUpdate($event, index)"
            ></view-port>
        </v-content>
    </v-app>
</template>
<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

import ViewPort from './components/ViewPort.vue'
import NetworkStatus from './components/NetworkStatus.vue'
import { remote, Event } from 'electron'
import Vendor from './vendor'
import TabButton from './components/TabButton.vue'
import TxRecordsPanel from './components/TxRecordsPanel.vue'

let counter = 0

function portIdGenerator(): number {
    ++counter
    return Date.now() + counter
}

function getDefaultTab(): TabBar.Item {
    return {
        title: 'New tab',
        iconUrl: '',
        src: '',
        id: portIdGenerator(),
        status: 'new'
    }
}

@Component({
    components: {
        ViewPort,
        NetworkStatus,
        Vendor,
        TabButton,
        TxRecordsPanel
    }
})
export default class Nova extends Vue {
    private tabs: TabBar.Item[] = [getDefaultTab()]
    private currentIndex = 0

    clickTab(index: number) {
        this.currentIndex = index
    }

    closeTab(index: number) {
        if (this.tabs.length < 2) {
            remote.getCurrentWindow().close()
            return
        }
        this.tabs = this.tabs.slice(0, index).concat(this.tabs.slice(index + 1))
        this.updateCurrentIndex(index)
    }

    updateCurrentIndex(index: number) {
        const isCurrent = index === this.currentIndex
        this.$nextTick(() => {
            if (this.currentIndex === this.tabs.length) {
                this.currentIndex = this.tabs.length - 1
            } else {
                this.currentIndex--
            }

            if (this.tabs.length === 0) {
                this.currentIndex = -1
            }
        })
    }

    get items() {
        return this.tabs.map<TabButton.Value>((t, i) => ({
            active: i === this.currentIndex,
            url: t.src,
            title: t.title,
            favicon: t.iconUrl
        }))
    }

    created() {
        remote.app.EXTENSION.inject(
            ENV.contents!.id,
            `nova.${ENV.xargs!.clientId![0]}`, {
                newTab: (cb: () => void) => {
                    this.onAddTAb()
                    cb()
                },
                closeTab: (cb: () => void) => {
                    if (this.items.length > 1) {
                        this.closeTab(this.currentIndex)
                    } else {
                        remote.getCurrentWindow().close()
                    }
                    cb()
                }
            }
        )

        BUS.$on('open-dapp', (data: any) => {
            let tab = getDefaultTab()
            tab.src = data.src
            tab.title = data.name
            this.tabs.push(tab)
            this.currentIndex = this.tabs.length - 1
        })
    }

    onAddTAb() {
        this.tabs.push(getDefaultTab())
        this.currentIndex = this.tabs.length - 1
    }

    onDataUpdate(event: ViewPort.DataUpdateEvent, index: number) {
        let mapping: any = {
            url: 'src',
            icon: 'iconUrl',
            title: 'title'
        }
        this.$set(this.tabs[index], mapping[event.type], event.value)
    }

    onStatusUpdate(event: ViewPort.StatusUpdateEvent, index: number) {
        console.log(event, index)
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
    height: 100vh;
    width: 100vw;
}
.sync-container .viewport-layout {
    position: absolute;
    height: 100%;
}
.drag-zone {
    -webkit-app-region: drag;
}

.viewport {
    position: absolute;
    height: 100%;
    width: 100%;
}
#frame .tab-group {
    height: 100%;
    margin-left: 60px;
    flex: 0 1 auto;
    flex-direction: row;
    align-items: flex-end;
    transition: margin-left 0.3s ease-out;
}
.darwin.full-screen #frame .tab-group {
    margin-left: 0;
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
    z-index: 0;
}
.sync-viewport-container.current {
    z-index: 2;
}
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.5s;
}
.fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
    opacity: 0;
}

.list-complete-enter
/* .list-complete-leave-active for below version 2.1.8 */ {
    transform: translateY(100%);
}

.list-complete-leave-active {
    position: absolute;

    opacity: 0;
}
</style>
