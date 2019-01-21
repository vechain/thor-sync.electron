<template>
    <div>
        <template v-for="(view,i) in stack">
            <WebView
                v-if="view.type==='webview'"
                v-show="i===activeIndex"
                :key="view.id"
                :href.sync="view.href"
                :action="view.action"
                @update:status="view.status=$event"
                @update:wheel="updateWheel($event)"
                style="width:100%;height:100%;"
            />
            <component
                v-else
                v-show="i===activeIndex"
                :is="view.component"
                :key="view.id"
                :href.sync="view.href"
                :action="view.action"
                @update:status="view.status=$event"
                style="width:100%;height:100%;"
            />
        </template>
    </div>
</template>
<script lang="ts">
import { Vue, Component, Prop, Watch, Model, Emit } from 'vue-property-decorator'
import BuiltinBase, { builtinClass } from './Builtin.vue'

class View {
    static nextId = 0
    id = View.nextId++
    component?: typeof BuiltinBase
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
    readonly status: WebStatus = {
        title: '',
        favicon: '',
        progress: 0,
        cert: null,
        committed: false,
        domReady: false,
        canGoForward: false,
        canGoBack: false
    }

    readonly type: 'webview' | 'builtin'
    constructor(public href: string) {
        this.type = View.hrefToType(href)
        if (this.type === 'builtin') {
            this.component = builtinClass()
        }
    }

    public static hrefToType(href: string) {
        return (!href || href.toLowerCase().startsWith('sync:')) ? 'builtin' : 'webview'
    }
}


@Component
export default class Launcher extends Vue {
    readonly stack: View[] = []
    activeIndex = -1
    get active() { return this.stack[this.activeIndex] }

    @Prop(Boolean) visible!: boolean
    @Prop(String) href!: string
    @Prop(Object) action!: WebAction

    @Emit('update:href')
    updateHref(val: string) { }
    @Emit('update:status')
    updateStatus(val: WebStatus) { }
    @Emit('update:wheel')
    updateWheel(val: { x: number, y: number }) { }

    @Watch('href')
    hrefChanged(val: string) {
        const active = this.active
        if (active.href === val) {
            return
        }
        const viewType = View.hrefToType(val)
        if (active.type === viewType) {
            active.href = val
            this.stack.splice(
                this.activeIndex + 1,
                Number.MAX_SAFE_INTEGER)
        } else {
            active.action.suspend = 'strip'
            this.stack.splice(
                this.activeIndex + 1,
                Number.MAX_SAFE_INTEGER,
                new View(val))
            this.activeIndex++
        }
    }
    @Watch('action.goBack')
    actionGoBack() {
        const active = this.active
        if (!active.status.committed) {
            return
        }
        if (active.status.canGoBack) {
            active.action.goBack++
        } else if (this.activeIndex > 0) {
            active.action.suspend = 'normal'
            this.activeIndex--
            this.stack[this.activeIndex].action.suspend = null
        }
    }
    @Watch('action.goForward')
    actionGoForward() {
        const active = this.active
        if (!active.status.committed) {
            return
        }
        if (active.status.canGoForward) {
            active.action.goForward++
        } else if (this.activeIndex + 1 < this.stack.length) {
            active.action.suspend = 'normal'
            this.activeIndex++
            this.stack[this.activeIndex].action.suspend = null
        }
    }
    @Watch('action.reload')
    actionReload() {
        this.active.action.reload++
    }
    @Watch('action.reloadIgnoringCache')
    actionReloadIgnoringCache() {
        this.active.action.reloadIgnoringCache++
    }
    @Watch('action.stop')
    actionStop() {
        this.active.action.stop++
    }
    @Watch('action.reGo')
    actionRego() {
        this.active.action.reGo++
    }
    @Watch('action.zoomIn')
    actionZoomIn() {
        this.active.action.zoomIn++
    }
    @Watch('action.zoomOut')
    actionZoomOut() {
        this.active.action.zoomOut++
    }
    @Watch('action.zoomReset')
    actionZoomReset() {
        this.active.action.zoomReset++
    }



    @Watch('active.href')
    activeViewHrefChanged(val: string) {
        this.updateHref(val)
    }
    @Watch('active.status', { deep: true })
    activeViewStatusChanged(val: WebStatus) {
        val = { ...val }
        if (!val.canGoBack) {
            if (this.activeIndex > 0) {
                val.canGoBack = true
            }
        }
        if (!val.canGoForward) {
            if (this.activeIndex + 1 < this.stack.length) {
                val.canGoForward = true
            }
        }
        this.updateStatus(val)
    }

    created() {
        this.stack.push(new View(this.href))
        this.activeIndex = 0
    }
}
</script>
