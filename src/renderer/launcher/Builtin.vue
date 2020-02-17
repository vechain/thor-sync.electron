<template>
    <div style="position:relative;">
        <transition
            :enter-active-class="`animated faster ${enterClass}`"
            :leave-active-class="`animated faster ${leaveClass}`"
        >
            <router-view
                :key="routerKey"
                style="position:absolute;left:0;top:0;right:0;bottom:0;overflow:auto"
            />
        </transition>
    </div>
</template>
<script lang="ts">
import { Vue, Component, Watch, Prop, Emit } from 'vue-property-decorator'
import VueRouter, { RouteConfig } from 'vue-router'
import Portal from './Portal.vue'
import Wallets from './Wallets.vue'
import WalletsList from './WalletsList.vue'
import WalletDetail from './WalletDetail.vue'
import Settings from './Settings.vue'
import Transfer from './Transfer.vue'

@Component
export default class BuiltinBase extends Vue {
    @Prop(String) href!: string
    @Prop(Object) action!: WebAction

    @Emit('update:href')
    updateHref(val: string) { }
    @Emit('update:status')
    updateStatus(status: WebStatus) { }

    get routerKey() {
        if (this.$route.matched.find(i => i.name === 'wallets')) {
            return 'wallets'
        }
        return this.$route.fullPath
    }

    status: WebStatus = {
        title: '',
        favicon: '',
        progress: 1,
        cert: null,
        committed: true,
        domReady: true,
        canGoForward: false,
        canGoBack: false
    }


    @Watch('href')
    hrefChanged(val: string) {
        const path = hrefToPath(val)
        if (this.$route.path !== path) {
            this.$router.push(path)
        }
    }
    @Watch('status', { deep: true })
    statusChanged() {
        this.updateStatus({ ...this.status })
    }

    @Watch('action.goBack')
    goBack() { this.$router.back() }
    @Watch('action.goForward')
    goForward() { this.$router.forward() }
    @Watch('action.suspend')
    suspend(val: WebAction['suspend']) {
        if (val === 'strip') {
            const history = this.$router.history
            history.stack = history.stack.slice(0, this.$router.history.index + 1)
            this.status.canGoForward = history.index < history.stack.length - 1
            this.status.canGoBack = history.index > 0
        }
    }

    historyIndex = 0
    enterClass = ''
    leaveClass = ''

    @Watch('historyIndex')
    historyIndexChanged(newVal: number, oldVal: number) {
        if (newVal > oldVal) {
            // forward
            this.enterClass = 'slide-in'
            this.leaveClass = 'fade-out'
        } else if (newVal < oldVal) {
            // backward
            this.enterClass = 'fade-in'
            this.leaveClass = 'slide-out'
        }
    }

    @Watch('$route')
    routed() {
        const history = this.$router.history
        this.historyIndex = history.index

        const path = this.$route.path
        if (path === '/') {
            this.updateHref('')
        } else {
            this.updateHref('sync:/' + path)
        }

        this.status.canGoForward = history.index < history.stack.length - 1
        this.status.canGoBack = history.index > 0
        this.status.title = (this.$route.meta || {}).title || ''
        this.status.favicon = guessFavicon(path)
    }

    created() {
        this.$router.push(hrefToPath(this.href || ''))
    }
}


function hrefToPath(href: string) {
    if (href.startsWith('sync:/')) {
        return href.slice('sync:/'.length)
    }
    return href
}

function guessFavicon(path: string) {
    if (path.includes('wallets')) {
        return 'mdi-cards'
    } else if (path.includes('settings')) {
        return 'mdi-settings'
    } else if (path.includes('transfer')) {
        return 'mdi-transfer'
    } else {
        return 'mdi-home'
    }
}

export function builtinClass() {
    @Component({
        router: new VueRouter({
            mode: 'abstract',
            routes: routes
        })
    })
    class Builtin extends BuiltinBase { }
    return Builtin
}


const routes: RouteConfig[] = [
    {
        path: '/',
        name: 'portal',
        component: Portal,
        meta: {
            title: 'Home'
        }
    },
    {
        path: '/wallets',
        name: 'wallets',
        component: Wallets,
        redirect: {
            path: '/wallets/local'
        },
        meta: {
                title: 'Wallets'
        },
        children: [{
            name: 'wallets-list',
            path: '/wallets/:group',
            component: WalletsList,
            meta: {
                title: 'Wallets'
            }
        }]
    },
    {
        path: '/wallets/:group/:indexOrId',
        name: 'wallet-detail',
        component: WalletDetail,
        meta: {
            title: 'Wallet Detail'
        }
    },
    {
        path: '/settings',
        name: 'settings',
        component: Settings,
        meta: {
            title: 'Settings'
        }
    },
    {
        path: '/transfer',
        name: 'transfer',
        component: Transfer,
        meta: {
            title: 'Transfer'
        }
    },
    {
        path: '*',
        redirect: '/'
    }
]
</script>
<style>
@keyframes slide-in {
    from {
        opacity: 0;
        transform: translate3d(60px, 0, 0);
    }
    to {
        transform: translate3d(0, 0, 0);
        animation-timing-function: cubic-bezier(0.215, 0.61, 0.355, 1);
    }
}

@keyframes slide-out {
    to {
        opacity: 0;
        transform: translate3d(60px, 0, 0);
    }
}
@keyframes fade-out {
    to {
        opacity: 0;
    }
}

@keyframes fade-in {
    from {
        opacity: 0;
    }
}
.slide-in {
    animation-name: slide-in;
}
.slide-out {
    animation-name: slide-out;
}
.fade-in {
    animation-name: fade-in;
}
.fade-out {
    animation-name: fade-out;
}

.animated {
    animation-duration: 1s;
    animation-fill-mode: both;
}
.animated.faster {
    animation-duration: 240ms;
}
</style>
