<template>
    <div>
        <router-link to="/">Home</router-link>
        <router-link to="/apps">Apps</router-link>
        <router-link to="/wallets">Wallets</router-link>
        <router-view />
    </div>
</template>
<script lang="ts">

import { Vue, Component } from 'vue-property-decorator'
import VueRouter, { RouteConfig } from 'vue-router'
import Portal from './Portal.vue'
import DApps from '../components/AppList.vue'
import Wallets from './Wallets.vue'

@Component
export default class Router extends Vue {    
    public static create(target: Vue) {
        return new Router({
            store: target.$store,
            router: new VueRouter({
                routes: routes
            })
        })
    }
}

const routes: RouteConfig[] = [
    { path: '/', component: Portal },
    { path: '/apps', component: DApps},
    { path: '/wallets', component: Wallets },
]
</script>
