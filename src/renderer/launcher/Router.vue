<template>
    <div style="height: 100%">
        <router-view />
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
        name: 'home',
        component: DApps
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
        path: '/wallet/:address',
        name: 'walletDetail',
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
                    title: 'Settings-Shortcuts'
                }
            },
            {
                path: 'network',
                name: 'settings-network',
                component: Network,
                meta: {
                    title: 'Settings-Networks'
                }
            },
            {
                path: 'update',
                name: 'settings-update',
                component: Update,
                meta: {
                    title: 'Settings-Auto Update'
                }
            }
        ]
    }
]
</script>
