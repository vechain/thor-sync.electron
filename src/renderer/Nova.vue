<template>
    <v-app :dark="darkTheme" v-resize="onResize" class="app-fadein" v-show="storeReady">
        <!-- required by tab button -->
        <svg height="0" width="0">
            <defs>
                <clipPath id="left-corner">
                    <path d="M5 0 h1 v5 h-6 a5 5 90 0 0 5 -5"></path>
                </clipPath>
                <clipPath id="right-corner">
                    <path d="M1 0 a5 5 90 0 0 5 5 h-6"></path>
                </clipPath>
                <clipPath id="app-button-badge">
                    <path
                        d="M 0 0 h 14 a 7 7 90 0 1 7 7 v 14 a 3 3 -90 0 0 -3 -3 h -8 a 7 7 90 0 1 -7 -7 v -8 a 3 3 -90 0 0 -3 -3"
                    ></path>
                </clipPath>
            </defs>
        </svg>
        <DialogProxy :v-show="false"/>
        <div class="toolbar">
            <b
                v-if="devMode"
                class="px-2 white--text"
                style="position:absolute;background:rgba(240,144,0,0.6);pointer-event:none"
                :style="{right:isDarwin?'0px':'138px'}"
            >Dev Mode</b>
            <v-layout class="drag">
                <transition-group
                    tag="v-layout"
                    class="tab-bar"
                    @dblclick.native="onDblClickTitleBar"
                    @mousedown.native.self.prevent
                    name="tab-button"
                >
                    <!-- here use @mouseup instead of @click, 
                    since the area of window title is not responsive on osx-->
                    <TabButton
                        v-for="(page,i) in pages"
                        class="tab-button no-drag"
                        :key="'tab'+page.id"
                        :title="page.title"
                        :favicon="page.isBuiltin? '': page.favicon"
                        :placeholder="page.isBuiltin? page.favicon : ''"
                        :active="i===activePageIndex"
                        :canClose="pages.length > 1"
                        @close="closeTab(i)"
                        @mouseup.native="activePageIndex = i"
                        @dblclick.native.stop
                    />
                    <v-btn
                        class="no-drag ma-1 pa-0 ml-2"
                        flat
                        small
                        key="the-new-tab-button"
                        @mouseup.native="openTab('')"
                        @dblclick.native.stop
                        style="width:auto;height:auto;min-width:auto;"
                    >
                        <v-icon style="font-size:150%">add</v-icon>
                    </v-btn>
                </transition-group>
                <!-- an overlapped area to make it easy to drag -->
                <div class="drag" style="position:absolute;left:0;top:0;right:0;height:14px;"></div>
                <WindowControls v-if="!isDarwin" class="no-drag" style="flex:0 0 auto;"/>
            </v-layout>
            <div class="nav-bar">
                <v-layout row align-center px-1>
                    <v-btn
                        class="my-1"
                        small
                        icon
                        :disabled="!activePage.canGoBack"
                        @click="activePage.goBack()"
                    >
                        <v-icon style="font-size:150%">arrow_back</v-icon>
                    </v-btn>
                    <v-btn
                        class="my-1"
                        small
                        icon
                        :disabled="!activePage.canGoForward"
                        @click="activePage.goForward()"
                    >
                        <v-icon style="font-size:150%">arrow_forward</v-icon>
                    </v-btn>
                    <v-btn
                        class="my-1"
                        small
                        icon
                        :disabled="activePage.isBuiltin"
                        @click="activePage.reloadOrStop($event.shiftKey)"
                    >
                        <v-icon style="font-size:150%">{{activePage.loading ? 'close': 'refresh'}}</v-icon>
                    </v-btn>
                    <div
                        ref="navBox"
                        class="mx-2 nav-box"
                        :class="{'nav-box-focused': urlBoxFocused}"
                    >
                        <v-layout align-center style="position:relative;" fill-height>
                            <NodeStatusPanel
                                :nudge-top="2"
                                slot="activator"
                                @switchNode="activateOrOpenWindow"
                            >
                                <v-btn
                                    flat
                                    slot="activator"
                                    class="ma-0 px-1"
                                    style="min-width:auto;"
                                >
                                    <NodeStatus/>
                                </v-btn>
                            </NodeStatusPanel>
                            <v-layout
                                ref="urlBoxWithIcon"
                                class="url-box-with-icon"
                                fill-height
                                align-center
                            >
                                <CertIndicator
                                    v-if="!!activePage.cert && !activePage.userInput"
                                    class="mx-2"
                                    :cert="activePage.cert"
                                />
                                <v-icon v-else style="font-size:95%" class="mx-2">mdi-earth</v-icon>
                                <AccessHistoryPanel
                                    style="flex:1 1 auto;height:100%;transition: all 0s;"
                                    v-model="showAccessHistory"
                                    absolute
                                    :close-on-click="false"
                                    :close-on-content-click="false"
                                    :position-x="accessHistoryPosition.x"
                                    :position-y="accessHistoryPosition.y"
                                    :width="accessHistoryPosition.width"
                                    :keyword="keyword"
                                    @update:selection="activePage.userInput=$event.href"
                                    @select="onAccessHistorySelected"
                                >
                                    <UrlBox
                                        @click.stop
                                        slot="activator"
                                        ref="urlBox"
                                        v-model="activePage.userInput"
                                        :href="activePage.href"
                                        @update:href="navigateTo"
                                        class="url-box"
                                        placeholder="Enter URL | app | block | tx | account to go"
                                        @focus="urlBoxFocused=true"
                                        @blur="onUrlBoxBlur"
                                        @input="onUrlBoxInput"
                                    />
                                </AccessHistoryPanel>
                            </v-layout>
                            <Tooltip>
                                <ExpansionBtn
                                    slot="activator"
                                    v-show="showAddShortcutBtn"
                                    small
                                    flat
                                    style="min-width:auto;text-transform:none"
                                    :ripple="false"
                                    class="ma-0 caption"
                                    @action="addOrRemoveShortcut"
                                >
                                    <v-icon
                                        style="font-size:160%"
                                    >{{shortcutAdded ? 'mdi-bookmark-plus' : 'mdi-bookmark-plus-outline'}}</v-icon>
                                    <template
                                        slot="expansion"
                                    >{{shortcutAdded?'Remove shortcut': 'Add shortcut'}}</template>
                                </ExpansionBtn>
                                <span>{{shortcutAdded? 'Remove shortcut':'Add shortcut'}}</span>
                            </Tooltip>
                            <v-progress-linear
                                v-for="(page,i) in pages"
                                :key="'progress'+page.id"
                                v-show="i===activePageIndex"
                                background-color="rgba(0,0,0,0)"
                                :active="!page.isBuiltin && page.loading"
                                :value="page.progress"
                                class="ma-0"
                                height="2px"
                                style="position:absolute;left:0;right:0;bottom:0;"
                            />
                        </v-layout>
                    </div>
                    <Tooltip>
                        <v-btn class="my-1" icon small slot="activator" @click="onWallets">
                            <v-icon style="font-size:135%;">mdi-cards</v-icon>
                        </v-btn>
                        <span>Wallets</span>
                    </Tooltip>
                    <ActivitiesPanel>
                        <v-btn class="my-1" icon small slot="activator">
                            <ActivitiesStatus/>
                        </v-btn>
                    </ActivitiesPanel>
                    <Tooltip>
                        <WindowMenu :items="menuItems" slot="activator">
                            <v-btn class="my-1" icon small slot="activator">
                                <v-icon style="font-size:150%">mdi-dots-vertical</v-icon>
                            </v-btn>
                        </WindowMenu>
                        <span>Options</span>
                    </Tooltip>
                </v-layout>
                <div class="sharp-line"/>
            </div>
        </div>
        <v-content>
            <Vendor/>
            <UpdateChecker/>
            <Swiper
                ref="swiper"
                style="width:100%;height:100%;"
                :canSwipeRight="activePage.canGoBack"
                :canSwipeLeft="activePage.canGoForward"
                @swipe="onSwipe"
            >
                <Launcher
                    v-for="(page,i) in pages"
                    v-show="i===activePageIndex"
                    :key="page.id"
                    :href.sync="page.href"
                    :action="page.action"
                    @update:status="page.updateStatus($event)"
                    style="position:absolute;left:0;top:0;right:0;bottom:0;"
                    @update:href="page.userInput=''"
                    @update:wheel="onWebviewWheel"
                />
            </Swiper>
        </v-content>
    </v-app>
</template>
<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'
import { remote } from 'electron'
import Vendor from './vendor'
import Launcher from './launcher'
import * as UrlUtils from '@/common/url-utils'
import { State } from 'vuex-class'
import { nameOfNetwork } from '@/node-configs'

class Page {
    static nextId = 0

    id = Page.nextId++
    userInput = ''
    href = ''

    private readonly status: WebStatus = {
        title: '',
        favicon: '',
        progress: 0,
        committed: false,
        domReady: false,
        canGoBack: false,
        canGoForward: false,
        cert: null
    }

    readonly action: WebAction = {
        goBack: 0,
        goForward: 0,
        reload: 0,
        reloadIgnoringCache: 0,
        stop: 0,
        reGo: 0,
        zoomIn: 0,
        zoomOut: 0,
        zoomReset: 0,
        suspend: null
    }

    constructor(href: string) {
        this.href = href
    }

    updateStatus(status: WebStatus) { Object.assign(this.status, status) }
    get title() { return this.status.title || this.href }
    get favicon() { return this.status.favicon }
    get progress() { return this.isBuiltin ? 100 : this.status.progress * 100 }
    get loading() { return this.status.progress !== 1 }
    get isBuiltin() { return !this.href || this.href.toLowerCase().startsWith('sync:') }
    get canGoBack() { return this.status.canGoBack }
    get canGoForward() { return this.status.canGoForward }
    get cert() { return this.status.cert }

    goBack() { this.action.goBack++ }
    goForward() { this.action.goForward++ }
    reloadOrStop(shiftKey: boolean) {
        if (this.progress === 100) {
            if (shiftKey) {
                this.action.reloadIgnoringCache++
            } else {
                this.action.reload++
            }
        } else {
            this.action.stop++
        }
        this.userInput = ''
    }
    reload() {
        this.action.reload++
        this.userInput = ''
    }
    forceReload() {
        this.action.reloadIgnoringCache++
        this.userInput = ''
    }
    zoomIn() {
        this.action.zoomIn++
    }
    zoomOut() {
        this.action.zoomOut++
    }
    zoomReset() {
        this.action.zoomReset++
    }
}

type OpenTab = {
    href: string
    title?: string
    mode?: 'append-active' | 'inplace'
}

@Component({
    components: {
        Vendor,
        Launcher
    }
})
export default class Nova extends Vue {
    devMode = ENV.devMode
    pages: Page[] = []
    activePageIndex = 0
    get activePage() { return this.pages[this.activePageIndex] }
    urlBoxFocused = false

    accessHistoryPosition = { x: 0, y: 0, width: 0 }
    showAccessHistory = false
    keyword = ''
    isDarwin = process.platform === 'darwin'

    @State shortcuts !: entities.Shortcut[]


    @Watch('activePage.href')
    @Watch('activePage')
    activePageChanged() {
        (this.$refs.urlBoxWithIcon as Element).querySelector('input')!.blur()
    }

    get showAddShortcutBtn() {
        return !this.activePage.isBuiltin && !this.activePage.userInput
    }

    get shortcutAdded() {
        return (this.shortcuts || []).findIndex(s => s.href === this.activePage.href) >= 0
    }

    get storeReady() {
        return this.$store.state.ready
    }

    get darkTheme() {
        return this.$store.getters.darkTheme
    }

    closeTab(index: number) {
        if (this.pages.length < 2) {
            remote.getCurrentWindow().close()
            return
        }

        this.pages.splice(index, 1)
        if (index > this.activePageIndex) {
            return
        }

        this.activePageIndex = Math.max(this.activePageIndex - 1, 0)
    }

    openTab(href: string, mode?: 'append' | 'append-active' | 'inplace' | 'inplace-builtin') {
        const formalized = UrlUtils.formalize(href)
        if (mode === 'append-active') {
            const page = new Page(formalized)
            this.pages.splice(this.activePageIndex + 1, 0, page)
            if (!this.isModaling()) {
                this.activePageIndex++
            }
        } else if (mode === 'inplace') {
            this.activePage.href = formalized
        } else if (mode === 'inplace-builtin') {
            if (this.activePage.isBuiltin) {
                this.activePage.href = formalized
            } else {
                this.openTab(href, 'append')
            }
        } else {
            const page = new Page(formalized)
            this.pages.push(page)
            if (!this.isModaling()) {
                this.activePageIndex = this.pages.length - 1
            }
        }
    }

    navigateTo(href: string) {
        const newHref = UrlUtils.formalize(href)
        if (newHref === this.activePage.href) {
            this.activePage.action.reGo++
        } else {
            this.activePage.href = newHref
        }
    }

    async created() {
        (document.querySelector('.splash')! as HTMLElement).style.display = 'none'

        const mq = remote.app.EXTENSION.mq
        const tabActionTopic = `TabAction-${remote.getCurrentWindow().id}`
        const initTabAction = mq.peek(tabActionTopic) as (TabAction | null)
        if (initTabAction && initTabAction.action === 'new' && initTabAction.url) {
            this.openTab(initTabAction.url)
        } else {
            this.pages.push(new Page(''))
        }
        BUS.$on('open-tab', (data: OpenTab) => {
            this.openTab(data.href, data.mode)
        })

        for (; ;) {
            const action = await mq.read(tabActionTopic, remote.getCurrentWebContents().id) as TabAction
            if (this.isModaling()) {
                continue
            }
            if (action.action === 'close') {
                this.closeTab(this.activePageIndex)
            } else if (action.action === 'new') {
                this.openTab(action.url || '')
            }
        }
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
        let payload: WindowAction | undefined
        switch (action) {
            case 'Minimize':
                payload = {
                    windowId: win.id,
                    action: 'minimize'
                }
                break
            case 'None':
                break
            default:
                if (win.isMaximized()) {
                    payload = {
                        windowId: win.id,
                        action: 'unmaximize'
                    }
                } else {
                    payload = {
                        windowId: win.id,
                        action: 'maximize'
                    }
                }
        }
        if (payload) {
            remote.app.EXTENSION.mq.post('WindowAction', payload)
        }
    }

    isModaling() {
        return !!document.querySelector('.v-overlay--active')
    }

    updateAccessHistoryLayout() {
        const rect = (this.$refs.urlBoxWithIcon as Element).getClientRects().item(0)!
        if (rect) {
            this.accessHistoryPosition.x = Math.round(rect.left)
            this.accessHistoryPosition.y = Math.round(rect.bottom) + 5

            const navBoxRect = (this.$refs.navBox as Element).getClientRects().item(0)!
            this.accessHistoryPosition.width = Math.round(navBoxRect.right - rect.left)
        }
    }

    onResize() {
        this.updateAccessHistoryLayout()
    }

    onUrlBoxInput(val: string) {
        val = val.trim()
        if (val.length > 0) {
            this.updateAccessHistoryLayout()
            this.keyword = val
            this.showAccessHistory = true
        } else {
            this.showAccessHistory = false
        }
    }
    onUrlBoxBlur() {
        this.urlBoxFocused = false
        this.showAccessHistory = false
    }
    onAccessHistorySelected(val: AccessHistoryPanel.Item) {
        this.activePage.href = val.href
        this.activePage.userInput = ''
    }

    onSwipe(dir: string) {
        if (dir === 'right') {
            this.activePage.goBack()
        } else {
            this.activePage.goForward()
        }
    }

    addOrRemoveShortcut() {
        if (this.shortcutAdded) {
            GDB.shortcuts.bulkDelete(
                this.shortcuts.filter(s => s.href === this.activePage.href).map(s => s.id!)
            )
        } else {
            GDB.shortcuts.add({
                title: this.activePage.title,
                href: this.activePage.href
            })
        }
    }
    onWebviewWheel(delta: { x: number, y: number }) {
        (this.$refs.swiper as any).handleWheel(delta.x, delta.y)
    }
    onWallets() {
        this.openTab('sync://wallets/local', 'inplace-builtin')
    }

    get menuItems(): WindowMenu.Item[] {
        const isDarwin = process.platform === 'darwin'
        return [{
            label: 'New Tab',
            keys: isDarwin ? ['command+t'] : ['ctrl+t'],
            action: () => this.openTab(''),
        }, {
            label: 'Close Tab',
            keys: isDarwin ? ['command+w'] : ['ctrl+w'],
            action: () => this.closeTab(this.activePageIndex)
        }, {
            label: 'Reload',
            keys: isDarwin ? ['command+r'] : ['f5', 'ctrl+r'],
            disabled: this.activePage.isBuiltin,
            action: () => { this.activePage.reload() }
        }, {
            label: 'Force Reload',
            keys: isDarwin ? ['command+shift+r'] : ['ctrl+shift+r'],
            disabled: this.activePage.isBuiltin,
            invisible: true,
            action: () => { this.activePage.forceReload() }
        }, {
            label: 'Go Back',
            keys: isDarwin ? ['command+['] : ['ctrl+['],
            disabled: !this.activePage.canGoBack,
            action: () => { this.activePage.goBack() }
        }, {
            label: 'Go Forward',
            keys: isDarwin ? ['command+]'] : ['ctrl+]'],
            disabled: !this.activePage.canGoForward,
            action: () => { this.activePage.goForward() }
        }, {
            label: 'Open Location',
            keys: isDarwin ? ['command+l'] : ['ctrl+l'],
            invisible: true,
            action: () => { (this.$refs.urlBox as any).$el.focus() }
        }, {
            label: 'Zoom In',
            keys: isDarwin ? ['command+='] : ['ctrl+='],
            disabled: this.activePage.isBuiltin,
            action: () => { this.activePage.zoomIn() },
            divider: true
        }, {
            label: 'Zoom Out',
            keys: isDarwin ? ['command+-'] : ['ctrl+-'],
            disabled: this.activePage.isBuiltin,
            action: () => { this.activePage.zoomOut() }
        }, {
            label: 'Reset Zoom',
            keys: isDarwin ? ['command+0'] : ['ctrl+0'],
            disabled: this.activePage.isBuiltin,
            action: () => { this.activePage.zoomReset() }
        }, {
            label: 'Wallets',
            keys: [],
            action: () => { this.openTab('sync://wallets/local', 'inplace-builtin') },
            divider: true
        }, {
            label: 'Settings',
            keys: isDarwin ? ['command+,'] : [],
            action: () => { this.openTab('sync://settings', 'inplace-builtin') }
        }, {
            label: 'Toggle Developer Tools',
            keys: [],
            action: () => {
                const wc = remote.getCurrentWebContents()
                if (wc.isDevToolsOpened()) {
                    wc.closeDevTools()
                } else {
                    wc.openDevTools({ mode: 'detach' })
                }
            },
            divider: true
        }, {
            label: 'Online Help',
            keys: [],
            action: () => { this.openTab('https://github.com/vechain/thor-sync.electron/wiki') },
        }, {
            label: 'About',
            keys: [],
            action: () => {
                remote.app.EXTENSION.showAbout()
            }
        }]

    }

    activateOrOpenWindow(config: NodeConfig) {
        const wins = remote.BrowserWindow.getAllWindows()
        let win = wins.find(w => {
            try {
                const c = w.webContents.getWebPreferences().nodeConfig!
                return c.url === config.url && c.genesis.id === config.genesis.id
            } catch{
                return false
            }
        })

        if (win) {
            win.show()
        } else {
            win = remote.app.EXTENSION.createWindow(config)
        }
        if (!this.activePage.isBuiltin) {
            remote.app.EXTENSION.mq.post(`TabAction-${win.id}`, {
                action: 'new',
                url: this.activePage.href
            })
        }
    }
}
</script>

<style lang="scss">
html {
    overflow: hidden; // vuetify will set this value to 'scroll', overwrite it
}

.toolbar {
    overflow: hidden;
}
.html-full-screen .toolbar {
    display: none;
}

.theme--light .toolbar {
    background-color: #e6e6e6;
}

.theme--dark .toolbar {
    background-color: #404040;
}

.blur .theme--light .toolbar {
    background-color: #f4f4f4;
}
.blur .theme--dark .toolbar {
    background-color: #383838;
}

.tab-bar {
    overflow: hidden;
    padding: 8px 40px 0px 8px;
    transition: padding 0.2s;
}

.darwin .tab-bar {
    padding-left: 80px;
}

.darwin.full-screen .tab-bar {
    padding-left: 8px;
    padding-top: 3px;
}
.tab-button {
    flex: 0 1 auto;
    width: 220px;
}
.drag {
    -webkit-app-region: drag;
}
.no-drag {
    -webkit-app-region: no-drag;
}

.tab-tools {
    float: right;
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
.theme--light .v-dialog {
    box-shadow: 0px 11px 15px -7px rgba(0, 0, 0, 0.2),
        0px 24px 38px 3px rgba(0, 0, 0, 0.14),
        0px 9px 46px 8px rgba(0, 0, 0, 0.12),
        rgba(0, 0, 0, 0.2) 0px 0px 0px 0.5px;
    border-radius: 6px;
}

.theme--light .card-border-thin {
    position: relative;
}
.theme--light .card-border-thin::before {
    pointer-events: none;
    border-radius: inherit;
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    width: 100%;
    box-shadow: rgba(0, 0, 0, 0.2) 0px 0px 0px 0.5px inset;
}

.theme--light .card-border {
    border: 1px solid rgba(0, 0, 0, 0.1);
}

.v-overlay--active:before {
    opacity: 0.05;
}

.theme--dark .v-overlay--active:before {
    opacity: 0.3;
}

.v-overlay {
    transition: 0.2 ease;
}
.v-expansion-panel__header {
    padding-right: 12px !important;
}
.v-expansion-panel__header__icon {
    margin-left: 12px !important;
}

.tab-button-enter {
    width: 0px;
    opacity: 0;
}
.tab-button-leave-active {
    display: none;
}

.nav-bar {
    box-shadow: 0px 1px 1px 0px rgba(0, 0, 0, 0.2);
}
.theme--light .nav-bar {
    background-color: #ffffff;
}
.theme--dark .nav-bar {
    background-color: #212121;
}

.nav-box {
    background-color: rgba(0, 0, 0, 0.05);
    border-radius: 4px;
    overflow: hidden;
    height: 24px;
    box-shadow: 0px 0px 0px 0.5px rgba(0, 0, 0, 0.05) inset;
    flex: 1 1 auto;
}

.theme--dark .nav-box {
    background-color: rgba(255, 255, 255, 0.12);
    box-shadow: none;
}

.nav-box-focused {
    box-shadow: 0px 0px 0px 2px rgba(25, 118, 210, 0.7);
}

.url-box {
    width: 100%;
    height: 100%;
    outline: none;
    color: rgba(0, 0, 0, 0.5);
    cursor: default;
    font-size: 13px;
}

.theme--dark .url-box {
    color: rgba(255, 255, 255, 0.6);
}

.url-box:focus {
    color: rgba(0, 0, 0, 0.8);
    cursor: text;
}

.theme--dark .url-box:focus {
    color: rgba(255, 255, 255, 1);
}

.url-box::placeholder {
    color: rgba(0, 0, 0, 0.35);
}

.theme--dark .url-box::placeholder {
    color: rgba(255, 255, 255, 0.4);
}

.url-box-with-icon:focus-within {
    background-color: #ffffff;
    box-shadow: 0px 0px 0px 1px rgba(0, 0, 0, 0.1);
}

.theme--dark .url-box-with-icon:focus-within {
    background-color: rgba(255, 255, 255, 0.1);
}

.theme--light.v-btn .v-btn__content .v-icon {
    color: rgba(0, 0, 0, 0.6);
}
.theme--dark.v-btn .v-btn__content .v-icon {
    color: rgba(255, 255, 255, 0.8);
}
.sharp-line {
    height: 1px;
    background-image: linear-gradient(
        to top,
        black 0%,
        black 51%,
        transparent 51%
    );
    background-size: 100% 1px;
    opacity: 0.15;
}

.theme--dark .sharp-line {
    opacity: 0.25;
}

.theme--light.application {
    color: rgba(0, 0, 0, 0.8);
}
.sign-dialog {
    position: fixed;
    right: 0;
    bottom: 0;
    width: auto;
    transition: 0.35s ease !important;
}
.sign-dialog-transition-enter,
.sign-dialog-transition-leave-to {
    transform: translateY(calc(100% + 20px));
    opacity: 0.8;
}
.v-dialog {
    transition: 0.15s ease;
}
.dialog-transition-enter {
    -webkit-transform: scale(0.8);
    transform: scale(0.8);
    opacity: 0;
}
.dialog-transition-leave-to {
    -webkit-transform: scale(0.85);
    transform: scale(0.85);
    opacity: 0;
}

.serif {
    font-family: "Roboto Slab";
}

@keyframes app-fadein {
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
}

.app-fadein {
    animation: 0.5s app-fadein;
}
:not(input):not(textarea):not(.v-icon--link),
:not(input):not(textarea):not(.v-icon--link)::after,
:not(input):not(textarea):not(.v-icon--link)::before {
    user-select: none;
    cursor: default;
}

.v-expansion-panel__header {
    cursor: default;
}

.v-menu__activator {
    cursor: default;
}
.v-menu__activator * {
    cursor: unset;
}
.v-dialog__activator {
    cursor: default;
}
.v-dialog__activator * {
    cursor: unset;
}
.theme--light.v-list .v-list__tile--link:hover,
.theme--light.v-list .v-list__tile--highlighted,
.theme--light.v-list .v-list__group__header:hover {
    background: rgba(0, 0, 0, 0.1);
}
.v-list__tile--link {
    cursor: default;
}

a:not(.v-list__tile):not(.v-tabs__item):hover{
    color: #2a94ff;
}

.selectable {
    user-select: text !important;
}

.top-link {
    margin-left: 8px;
    margin-right: 8px;
    min-width: 80px;
    font-weight: 500;
    text-align: center;
}
.v-text-field__details {
    overflow: visible;
}
.theme--dark .secondary {
    background-color: #777;
}
</style>
