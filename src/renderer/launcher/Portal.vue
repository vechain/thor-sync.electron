<template>
    <v-layout column align-center>
        <v-layout column align-center style="max-width:700px;width:100%" pa-3>
            <div v-if="storeReady && !hasWallet" class="text-xs-center py-5">
                <div class="headline grey--text font-weight-light mb-3">You have no wallet yet</div>
                <v-btn class="primary" @click="createWallet">Create now</v-btn>
            </div>
            <template v-if="storeReady && shortcuts.length>0">
                <div class="grey--text title font-weight-light my-1">Shortcuts</div>
                <div style="width:100%;">
                    <v-layout row wrap :justify-center="shortcuts.length<5">
                        <div
                            v-for="shortcut in shortcuts"
                            :key="shortcut.id"
                            class="py-1 px-2"
                            style="flex:0 1 20%;max-width:20%;"
                        >
                            <v-hover open-delay="500">
                                <AppButton
                                    slot-scope="{ hover }"
                                    :title="shortcut.title"
                                    :href="shortcut.href"
                                    :favicon="favicon(shortcut.href)"
                                    @click="navTo(shortcut)"
                                >
                                    <v-tooltip
                                        open-delay="600"
                                        top
                                        style="position:absolute;top:0;right:0"
                                        transition="fade-transition"
                                    >
                                        <v-btn
                                            slot="activator"
                                            v-show="hover"
                                            small
                                            icon
                                            class="ma-1"
                                            @click.stop="onEditShortcut(shortcut)"
                                        >
                                            <v-icon small>mdi-square-edit-outline</v-icon>
                                        </v-btn>
                                        <span>Edit shortcut</span>
                                    </v-tooltip>
                                </AppButton>
                            </v-hover>
                        </div>
                    </v-layout>
                </div>
            </template>
            <div v-else class="headline grey--text font-weight-light py-5">No shortcut</div>
        </v-layout>
    </v-layout>
</template>
<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import * as NodeUrl from 'url'
import { ShortcutEditDialog } from '@/renderer/components'
import * as AccessRecords from '../access-records'
const faviconsCache: { [href: string]: string } = {}

@Component
export default class Portal extends Vue {
    favicons: { [href: string]: string } = {}

    get storeReady() { return this.$store.state.ready }
    get shortcuts() { return this.$store.state.shortcuts as entities.Shortcut[] }
    get hasWallet() { return this.$store.state.wallets.length > 0 }

    favicon(href: string) {
        if (faviconsCache[href]) {
            return faviconsCache[href]
        }
        if (this.favicons[href]) {
            return this.favicons[href]
        }

        AccessRecords.queryFavicon(href)
            .then(favicon => {
                if (favicon) {
                    this.$set(this.favicons, href, favicon)
                    faviconsCache[href] = favicon
                }
            })
            .catch(console.warn)
        return ''
    }

    navTo(shortcut: entities.Shortcut) {
        BUS.$emit('open-tab', {
            href: shortcut.href,
            mode: 'inplace'
        })
    }

    onEditShortcut(shortcut: entities.Shortcut) {
        this.$dialog(ShortcutEditDialog, {
            id: shortcut.id!,
            title: shortcut.title,
            href: shortcut.href
        })
    }
    createWallet() {
        this.$router.push({ name: 'wallets' })
    }
}
</script>
<style>
.short-list-move {
    transition: all 0.3s;
    transition-timing-function: ease;
}
</style>
