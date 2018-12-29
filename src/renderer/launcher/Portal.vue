<template>
    <v-layout column align-center>
        <v-layout column align-center style="max-width:700px;width:100%" pa-3>
            <div class="grey--text title font-weight-light">Shortcuts</div>
            <div style="width:100%;">
                <v-layout row wrap :justify-center="shortcuts.length<5">
                    <div
                        v-for="shortcut in shortcuts"
                        :key="shortcut.id+''"
                        class="pa-1"
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
                                <v-btn
                                    v-show="hover"
                                    small
                                    icon
                                    class="ma-1"
                                    style="position:absolute;top:0;right:0"
                                    @click.stop="onEditShortcut(shortcut)"
                                >
                                    <v-icon small>mdi-square-edit-outline</v-icon>
                                </v-btn>
                            </AppButton>
                        </v-hover>
                    </div>
                </v-layout>
            </div>
        </v-layout>
    </v-layout>
</template>
<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import * as NodeUrl from 'url'
import { State } from 'vuex-class'
import { ShortcutEditDialog } from '@/renderer/components'
import * as AccessRecords from '../access-records'

const faviconsCache: { [href: string]: string } = {}

@Component
export default class Portal extends Vue {
    favicons: { [href: string]: string } = {}
    @State shortcuts!: entities.Shortcut[]

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
}
</script>
