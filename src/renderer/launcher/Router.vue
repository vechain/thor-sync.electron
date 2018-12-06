<template>
    <div style="position:relative;width:100%;height:100%;">
        <transition
            :enter-active-class="`animated faster ${enterClass}`"
            :leave-active-class="`animated faster ${leaveClass}`"
        >
            <router-view style="position:absolute;left:0;top:0;right:0;bottom:0;overflow:auto"/>
        </transition>
        <v-layout style="position:absolute;right:0;top:0;">
            <router-link tag="span" to="/">
                <v-btn icon>
                    <v-icon small>mdi-apps</v-icon>
                </v-btn>
            </router-link>
            <router-link tag="span" to="/wallets">
                <v-btn icon class="ml-0">
                    <v-icon small>mdi-cards</v-icon>
                </v-btn>
            </router-link>

            <router-link tag="span" to="/settings">
                <v-btn icon class="ml-0">
                    <v-icon small>mdi-settings</v-icon>
                </v-btn>
            </router-link>
        </v-layout>
    </div>
</template>
<script lang="ts">
import { Vue, Component, Watch } from 'vue-property-decorator'
import VueRouter, { RouteConfig } from 'vue-router'
import Portal from './Portal.vue'
import Wallets from './Wallets.vue'
import WalletDetail from './WalletDetail.vue'
import Settings from './Settings.vue'

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
        component: Portal,
        meta: {
            title: 'Home'
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
        component: Settings
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
