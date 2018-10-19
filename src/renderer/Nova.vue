<template>
    <v-app id="frame">
        <Vendor />
        <v-toolbar height="40px" dense flat class="sync-drag-zone" fixed app @dblclick="onDblClickTitleBar">
            <tab-bar v-model="currentIndex" @new-tab="onAddTAb" :tabs="tabs" @close="onTabRemove">
            </tab-bar>
            <NetworkStatus></NetworkStatus>
        </v-toolbar>
        <v-content class="sync-container">
            <view-port class="viewport-layout" :opt="item" @data-updated="onDataUpdate($event, index)"
                @status-updated="onStatusUpdate($event, index)" :class="{current: currentIndex === index}"
                v-for="(item, index) in tabs" :key="item.id">
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
import { remote, Event } from 'electron'
import Vendor from './vendor'

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
        TabBar,
        ViewPort,
        NetworkStatus,
        Vendor,
    }
})
export default class Nova extends Vue {
    private tabs: TabBar.Item[] = [getDefaultTab()]
    private currentIndex: number | null = null

    created() {
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
    }

    onTabRemove(index: number) {
        if (this.tabs.length > 1) {
            this.tabs.splice(index, 1)
        }
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

.sync-container .viewport-layout {
    position: absolute;
    height: 100%;
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
.darwin .sync-tab-bar {
    max-width: calc(100% - 100px);
}
</style>
