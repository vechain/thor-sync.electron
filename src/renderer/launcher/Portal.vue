<template>
    <v-layout column align-center>
        <v-dialog persistent v-model="showEditShortcutDialog" max-width="380px">
            <v-card
                v-nofocusout
                @keypress.enter="editingShortcut.name && saveShortcut()"
                @keydown.esc="showEditShortcutDialog=false"
            >
                <v-card-title>Shortcut</v-card-title>
                <v-card-text>
                    <v-text-field ref="shortcutTitle" label="Title" v-model="editingShortcut.name"/>
                    <div
                        class="grey--text text-truncate caption"
                        style="width:100%;"
                    >{{editingShortcut.href}}</div>
                </v-card-text>
                <v-card-actions>
                    <v-btn small flat color="red" @click="removeShortcut">Remove</v-btn>
                    <v-spacer/>
                    <v-btn small flat @click="showEditShortcutDialog=false">Cancel</v-btn>
                    <v-btn
                        small
                        :disabled="!editingShortcut.name"
                        flat
                        color="primary"
                        @click="saveShortcut"
                    >Save</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
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
                                :title="shortcut.value.name"
                                :href="shortcut.value.href"
                                :favicon="favicon(shortcut.value.href)"
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
import *as NodeUrl from 'url'
import { State } from 'vuex-class'
import { Entities } from '../database'

const faviconsCache: { [href: string]: string } = {}

@Component
export default class Portal extends Vue {
    favicons: { [href: string]: string } = {}
    @State shortcuts!: Array<Entities.Preference<'shortcut'>>
    showEditShortcutDialog = false

    editingShortcut = { id: 0, name: '', href: '' }

    favicon(href: string) {
        if (faviconsCache[href]) {
            return faviconsCache[href]
        }
        if (this.favicons[href]) {
            return this.favicons[href]
        }
        GDB.history.get({ 'href': href }).then(record => {
            if (record) {
                return record.favicon
            }
            const hostname = NodeUrl.parse(href).hostname || href

            return GDB.history
                .where('tokens')
                .startsWithIgnoreCase(hostname)
                .limit(1)
                .toArray().then(recs => {
                    if (recs.length > 0) {
                        return recs[0].favicon
                    }
                })
        }).then(favicon => {
            if (favicon) {
                this.$set(this.favicons, href, favicon)
                faviconsCache[href] = favicon
            }
        }).catch(console.warn)
    }

    navTo(shortcut: Entities.Preference<'shortcut'>) {
        BUS.$emit('open-tab', {
            href: shortcut.value.href,
            mode: 'inplace'
        })
    }
    onEditShortcut(shortcut: Entities.Preference<'shortcut'>) {
        this.editingShortcut = {
            id: shortcut.id!,
            name: shortcut.value.name,
            href: shortcut.value.href
        }
        this.showEditShortcutDialog = true
        const elem = (this.$refs.shortcutTitle as Vue).$el.querySelector('input')!
        setTimeout(() => {
            elem.focus()
            elem.select()
        }, 0)
    }
    removeShortcut() {
        GDB.preferences.delete(this.editingShortcut.id)
        this.showEditShortcutDialog = false
    }

    saveShortcut() {
        GDB.preferences.update(this.editingShortcut.id, {
            value: {
                name: this.editingShortcut.name,
                href: this.editingShortcut.href,
            }
        })
        this.showEditShortcutDialog = false
    }
}
</script>
