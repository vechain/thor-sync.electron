<template>
    <div style="position:relative;width:100%;height:100%;overflow:auto">
        <transition
            :enter-active-class="`animated faster ${enterClass}`"
            :leave-active-class="`animated faster ${leaveClass}`"
        >
            <router-view style="position:absolute;left:0;top:0;right:0;bottom:0;"/>
        </transition>
    </div>
</template>
<script lang="ts">
import { Vue, Component, Watch } from 'vue-property-decorator'
import VueRouter, { RouteConfig } from 'vue-router'
import Portal from './Portal.vue'
import DApps from '../components/AppList.vue'
import Wallets from './Wallets.vue'
import WalletDetail from './WalletDetail.vue'
import Settings from './Settings.vue'
import Shortcuts from './Shortcuts.vue'
import Networks from './Networks.vue'
import Update from './Update.vue'

@Component
export default class Router extends Vue {
    public static create(target: Vue) {
        return new Router({
            store: target.$store,
            router: new VueRouter({
                mode: 'abstract',
                routes: routes
            })
        })
    }

    historyIndex = 0
    enterClass = ''
    leaveClass = ''

    @Watch('$route')
    routed() {
        const newIndex = this.$router.history.index
        if (newIndex > this.historyIndex) {
            // forward
            this.enterClass = 'slide-in'
            this.leaveClass = 'fade-out'
        } else if (newIndex < this.historyIndex) {
            // backward
            this.enterClass = 'fade-in'
            this.leaveClass = 'slide-out'
        }
        this.historyIndex = newIndex
    }
}

const routes: RouteConfig[] = [
    {
        path: '/',
        name: 'portal',
        component: DApps,
        meta: {
            title: 'Sync'
        }
    },
    {
        path: '/wallets',
        name: 'wallets',
        component: Wallets,
        meta: {
            title: 'Wallets'
        }
    },
    {
        path: '/wallets/:address',
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
        redirect: {
            name: 'settings-shortcut'
        },
        children: [
            {
                path: 'shorcut',
                name: 'settings-shortcut',
                component: Shortcuts,
                meta: {
                    title: 'Settings - Shortcuts'
                }
            },
            {
                path: 'network',
                name: 'settings-network',
                component: Networks,
                meta: {
                    title: 'Settings - Networks'
                }
            },
            {
                path: 'update',
                name: 'settings-update',
                component: Update,
                meta: {
                    title: 'Settings - Auto Update'
                }
            }
        ]
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
