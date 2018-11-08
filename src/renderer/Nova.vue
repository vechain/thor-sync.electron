<template>
    <v-app id="frame">
        <Vendor/>
        <v-toolbar
            color="grey lighten-3"
            height="40px"
            class="drag elevation-0"
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
                    class="no-drag"
                    style="flex: 0 1 auto;width:200px;"
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
                    class="ma-1 pa-0 ml-2 no-drag"
                    style="width:auto;height:auto;min-width:auto;"
                >
                    <v-icon style="font-size:150%">add</v-icon>
                </v-btn>
            </transition-group>
            <v-spacer/>
            <NetworkStatus class="no-drag"></NetworkStatus>
            <TxRecordsPanel class="no-drag"/>
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
            if (isCurrent) {
                if (this.currentIndex === this.tabs.length) {
                    this.currentIndex = this.tabs.length - 1
                }
            } else {
                if (index < this.currentIndex) {
                    this.currentIndex--
                }
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
            `nova.${ENV.xargs!.clientId![0]}`,
            {
                newTab: (cb: () => void) => {
                    if (!this.isModaling()) {
                        this.onAddTAb()
                    }
                    cb()

                },
                closeTab: (cb: () => void) => {
                    if (!this.isModaling()) {
                        if (this.items.length > 1) {
                            this.closeTab(this.currentIndex)
                        } else {
                            remote.getCurrentWindow().close()
                        }
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

    isModaling() {
        return !!this.$el.querySelector('.v-overlay--active')
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
.tab-bar {
  overflow: hidden;
  padding: 16px 8px 0px 80px;
}
.tab-button {
  flex: 0 1 auto;
  width: 200px;
}
.drag {
  -webkit-app-region: drag;
}
.no-drag {
  -webkit-app-region: no-drag;
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

.toolbar {
  background-color: #e6e6e6;
}

.label {
  color: #fff;
  padding: 0px 4px;
  border-radius: 2px;
  font-size: 10px;
}
.break-all {
  word-break: break-all;
}
.theme--light.v-menu__content {
  box-shadow: 0px 5px 24px 2px rgba(0, 0, 0, 0.25),
    rgba(0, 0, 0, 0.5) 0px 0px 0.5px 0px;
  border-radius: 6px;
}
.theme--light.application .v-dialog {
  box-shadow: 0px 11px 15px -7px rgba(0, 0, 0, 0.2),
    0px 24px 38px 3px rgba(0, 0, 0, 0.14), 0px 9px 46px 8px rgba(0, 0, 0, 0.12),
    rgba(0, 0, 0, 0.3) 0px 0px 0px 0.5px;
  border-radius: 6px;
}

.theme--light.outline::before {
  pointer-events: none;
  border-radius: inherit;
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 100%;
  box-shadow: rgba(0, 0, 0, 0.25) 0px 0px 0px 0.5px inset;
}
</style>
