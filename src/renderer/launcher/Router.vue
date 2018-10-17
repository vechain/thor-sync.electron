<template>
    <div>
        <router-view />
    </div>
</template>
<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'
import VueRouter, { RouteConfig } from 'vue-router'
import Portal from './Portal.vue'
import DApps from '../components/AppList.vue'
import Wallets from './Wallets.vue'
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
        component: Wallets
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
                component: Shortcut
            },
            {
                path: 'network',
                name: 'settings-network',
                component: Network
            },
            {
                path: 'update',
                name: 'settings-update',
                component: Update
            }
        ]
    }
]
</script>
