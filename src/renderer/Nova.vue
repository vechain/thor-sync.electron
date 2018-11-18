<template>
    <v-app>
        <div class="toolbar">
            <transition-group
                tag="v-layout"
                class="drag tab-bar"
                @dblclick.native="onDblClickTitleBar"
                @mousedown.native.self.prevent
                name="tab-button"
            >
                <TabButton
                    v-for="(page,i) in pages"
                    class="tab-button"
                    :class="i=== activePageIndex?'drag':'no-drag'"
                    :key="'tab'+page.id"
                    :title="page.title"
                    :favicon="page.favicon"
                    :active="i===activePageIndex"
                    @close="closeTab(i)"
                    @mouseup.native="activePageIndex = i"
                    @dblclick.native.stop
                    @mousedown="i=== activePageIndex && $event.preventDefault()"
                />
                <v-btn
                    class="no-drag ma-1 pa-0 ml-2"
                    flat
                    small
                    key="the-new-tab-button"
                    :ripple="false"
                    @click="openTab('')"
                    @dblclick.native.stop
                    style="width:auto;height:auto;min-width:auto;"
                >
                    <v-icon style="font-size:150%">add</v-icon>
                </v-btn>
            </transition-group>
            <div class="elevation-1 no-drag nav-bar">
                <v-layout row align-center px-1>
                    <v-btn
                        class="my-1"
                        small
                        icon
                        :disabled="!activePage.canGoBack"
                        :ripple="false"
                        @click="activePage.goBack()"
                    >
                        <v-icon style="font-size:150%">arrow_back</v-icon>
                    </v-btn>
                    <v-btn
                        class="my-1"
                        small
                        icon
                        :disabled="!activePage.canGoForward"
                        :ripple="false"
                        @click="activePage.goForward()"
                    >
                        <v-icon style="font-size:150%">arrow_forward</v-icon>
                    </v-btn>
                    <v-btn
                        class="my-1"
                        small
                        :ripple="false"
                        icon
                        @click="activePage.reloadOrStop()"
                    >
                        <v-icon style="font-size:150%">{{activePage.loading ? 'close': 'refresh'}}</v-icon>
                    </v-btn>
                    <div class="mx-2 nav-box" :class="{'nav-box-focused': urlBoxFocused}">
                        <v-layout align-center style="position:relative;" fill-height>
                            <NetworkStatusPanel>
                                <v-btn
                                    :ripple="false"
                                    flat
                                    slot="activator"
                                    class="ma-0 px-1"
                                    style="min-width:auto;"
                                >
                                    <NetworkStatus/>
                                </v-btn>
                            </NetworkStatusPanel>
                            <v-layout class="url-box-with-icon" fill-height align-center>
                                <CertIndicator v-if="!!activePage.cert" class="mx-1" :cert="activePage.cert"/>
                                <UrlBox
                                    v-model="activePage.userInput"
                                    :href.sync="activePage.href"
                                    class="px-1 url-box"
                                    placeholder="Enter app name to search, or URL"
                                    @focus="urlBoxFocused=true"
                                    @blur="urlBoxFocused=false"
                                />
                            </v-layout>
                            <v-btn small flat style="min-width:auto" :ripple="false" class="ma-0">
                                <v-icon style="font-size:150%">mdi-bookmark-plus-outline</v-icon>
                            </v-btn>
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
                    <TxRecordsPanel>
                        <v-btn class="my-1" icon small slot="activator" :ripple="false">
                            <Activity/>
                        </v-btn>
                    </TxRecordsPanel>
                </v-layout>
                <v-divider/>
            </div>
        </div>
        <v-content>
            <Vendor/>
            <template v-for="(page,i) in pages">
                <Launcher
                    v-if="page.isBuiltin"
                    v-show="i===activePageIndex"
                    :key="'launcher'+page.id"
                    :href.sync="page.href"
                    :nav="page.nav"
                    @update:status="page.updateStatus($event)"
                    style="position:absolute;left:0;top:0;right:0;bottom:0;overflow:hidden"
                />
                <WebView
                    v-else
                    :visible="i===activePageIndex"
                    :key="'webview'+page.id"
                    style="position:absolute;left:0;top:0;right:0;bottom:0;"
                    :href.sync="page.href"
                    :nav="page.nav"
                    @update:status="page.updateStatus($event)"
                />
            </template>
        </v-content>
    </v-app>
</template>
<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'
import { remote } from 'electron'
import Vendor from './vendor'
import Launcher from './launcher'

class Page {
    static nextId = 0

    id = Page.nextId++
    href = ''
    userInput = ''

    private readonly status: WebView.Status = {
        title: '',
        favicon: '',
        progress: 0,
        canGoBack: false,
        canGoForward: false,
        cert: null
    }

    readonly nav: WebView.Nav = {
        goBack: 0,
        goForward: 0,
        reloadOrStop: 0
    }

    constructor(href: string) {
        this.href = href
    }

    updateStatus(status: WebView.Status) { Object.assign(this.status, status) }
    get title() { return this.status.title || this.href }
    get favicon() { return this.status.favicon }
    get progress() { return this.isBuiltin ? 100 : this.status.progress * 100 }
    get loading() { return this.status.progress !== 1 }
    get isBuiltin() { return !this.href || this.href.toLowerCase().startsWith('sync:') }
    get canGoBack() { return this.status.canGoBack }
    get canGoForward() { return this.status.canGoForward }
    get cert() { return this.status.cert }

    goBack() { this.nav.goBack++ }
    goForward() { this.nav.goForward++ }
    reloadOrStop() { this.nav.reloadOrStop++; this.userInput = '' }
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
    pages: Page[] = [new Page('')]
    activePageIndex = 0
    get activePage() { return this.pages[this.activePageIndex] }
    urlBoxFocused = false

    closeTab(index: number) {
        if (this.pages.length < 2) {
            remote.getCurrentWindow().close()
            return
        }

        this.pages.splice(index, 1)
        if (index < this.activePageIndex) {
            this.activePageIndex--
        } else {
            this.activePageIndex = Math.min(this.pages.length - 1, this.activePageIndex)
        }
    }

    openTab(href: string, mode?: 'append' | 'append-active' | 'inplace') {
        if (mode === 'append-active') {
            const page = new Page(href)
            this.pages.splice(this.activePageIndex + 1, 0, page)
            this.activePageIndex++
        } else if (mode === 'inplace') {
            this.pages[this.activePageIndex].href = href
        } else {
            const page = new Page(href)
            this.pages.push(page)
            this.activePageIndex = this.pages.length - 1
        }
    }

    created() {
        remote.app.EXTENSION.inject(
            remote.getCurrentWebContents().id,
            `nova.${remote.getCurrentWindow().id}`,
            {
                newTab: (cb: () => void) => {
                    if (!this.isModaling()) {
                        this.openTab('')
                    }
                    cb()

                },
                closeTab: (cb: () => void) => {
                    if (!this.isModaling()) {
                        this.closeTab(this.activePageIndex)
                    }
                    cb()
                }
            }
        )

        BUS.$on('open-tab', (data: OpenTab) => {
            this.openTab(data.href, data.mode)
        })
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

.toolbar {
  overflow: hidden;
}
.html-full-screen .toolbar {
    display: none
}

.theme--light .toolbar {
  background-color: #e6e6e6;
}

.theme--dark .toolbar {
  background-color: #404040;
}

.darwin.blur .theme--light .toolbar {
  background-color: #f4f4f4;
}
.darwin.blur .theme--dark .toolbar {
  background-color: #383838;
}

.tab-bar {
  overflow: hidden;
  padding: 8px 8px 0px 80px;
  transition: padding 0.2s;
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
    0px 24px 38px 3px rgba(0, 0, 0, 0.14), 0px 9px 46px 8px rgba(0, 0, 0, 0.12),
    rgba(0, 0, 0, 0.2) 0px 0px 0px 0.5px;
  border-radius: 6px;
}

.theme--light .outline {
  position: relative;
}
.theme--light .outline::before {
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
.v-overlay--active:before {
  opacity: 0.2;
}
.v-expansion-panel__header {
  padding-right: 12px !important;
}
.v-expansion-panel__header__icon {
  margin-left: 12px !important;
}

.tab-button-enter {
  width: 0px;
  padding: 0px !important;
}
.tab-button-leave-active {
  position: absolute;
  opacity: 0;
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
  height: 26px;
  box-shadow: 0px 0px 0px 0.5px rgba(0, 0, 0, 0.05) inset;
  flex: 1 1 auto;
}

.nav-box-focused {
  box-shadow: 0px 0px 0px 2px rgba(25, 118, 210, 0.7);
}

.url-box {
  flex: 1 1 auto;
  height: 100%;
  outline: none;
  color: rgba(0, 0, 0, 0.6);
}
.url-box:focus {
  color: rgba(0, 0, 0, 0.9);
}

.url-box-with-icon:focus-within {
  background-color: #ffffff;
  box-shadow: 0px 0px 0px 1px rgba(0, 0, 0, 0.1);
}

// override vuetify's
.v-card {
  box-shadow: 0px 1px 2px 0px rgba(0, 0, 0, 0.3);
}
.elevation-1 {
  box-shadow: 0px 1px 2px 0px rgba(0, 0, 0, 0.3) !important;
}
.elevation-2 {
  box-shadow: 0px 1.5px 3px 0px rgba(0, 0, 0, 0.3) !important;
}
.elevation-3 {
  box-shadow: 0px 2px 4px 0px rgba(0, 0, 0, 0.3) !important;
}
</style>
