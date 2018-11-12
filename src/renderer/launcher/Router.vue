<template>
    <div style="height: 100%" class="grey lighten-3">
        <transition
            mode="out-in"
            enter-active-class="animated faster bounceInDown"
            leave-active-class="animated faster bounceOutUp"
        >
            <router-view style="height:100%;"/>
        </transition>
    </div>
</template>
<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'
import VueRouter, { RouteConfig } from 'vue-router'
import Portal from './Portal.vue'
import DApps from '../components/AppList.vue'
import Wallets from './Wallets.vue'
import WalletDetail from './WalletDetail.vue'
import Settings from './Settings.vue'
import Shortcut from './Shortcut.vue'
import Network from './Network.vue'
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
                component: Shortcut,
                meta: {
                    title: 'Settings - Shortcuts'
                }
            },
            {
                path: 'network',
                name: 'settings-network',
                component: Network,
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
/* https://github.com/daneden/animate.css */
@keyframes bounceInDown {
    from,
    60%,
    75%,
    90%,
    to {
        animation-timing-function: cubic-bezier(0.215, 0.61, 0.355, 1);
    }

    0% {
        opacity: 0;
        transform: translate3d(0, -3000px, 0);
    }

    60% {
        opacity: 1;
        transform: translate3d(0, 25px, 0);
    }

    75% {
        transform: translate3d(0, -10px, 0);
    }

    90% {
        transform: translate3d(0, 5px, 0);
    }

    to {
        transform: translate3d(0, 0, 0);
    }
}

.bounceInDown {
    animation-name: bounceInDown;
}
@keyframes bounceOutUp {
  20% {
    transform: translate3d(0, -10px, 0);
  }

  40%,
  45% {
    opacity: 1;
    transform: translate3d(0, 20px, 0);
  }

  to {
    opacity: 0;
    transform: translate3d(0, -2000px, 0);
  }
}

.bounceOutUp {
  animation-name: bounceOutUp;
}

.animated {
    animation-duration: 1s;
    animation-fill-mode: both;
}
.animated.faster {
  animation-duration: 500ms;
}
</style>
