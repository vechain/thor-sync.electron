<template>
    <v-container>
        <v-layout row justify-center>
            <v-flex sm12>
                <v-toolbar>
                    <v-toolbar-title>Shortcuts</v-toolbar-title>
                    <v-divider class="mx-3" inset vertical></v-divider>
                    <span>Your favourite DApp will appear below</span>
                    <v-spacer/>
                    <NewShortcutDialog
                        @cancel="onCancelEdit"
                        @updated="onUpdate"
                        :editItem="editItem"
                        v-model="dialog"
                    />
                </v-toolbar>
                <v-data-table hide-actions width="800px" :headers="headers" :items="shortcuts">
                    <template slot="items" slot-scope="props">
                        <td class="text-xs-center">{{props.item.value.name}}</td>
                        <td class="text-xs-center">{{props.item.value.domain}}</td>
                        <td class="text-xs-center">
                            <v-btn
                                dark
                                small
                                icon
                                color="blue-grey lighten-3"
                                @click="onEdit(props.item)"
                            >
                                <v-icon small>edit</v-icon>
                            </v-btn>
                            <v-btn
                                @click="onDelete(props.item)"
                                dark
                                small
                                icon
                                color="blue-grey lighten-3"
                            >
                                <v-icon small>delete</v-icon>
                            </v-btn>
                        </td>
                    </template>
                </v-data-table>
            </v-flex>
        </v-layout>
        <ConfirmDialog max-width="300px" ref="confirm"/>
    </v-container>
</template>
<script lang="ts">
import { Vue, Component, Watch } from 'vue-property-decorator'
import { State } from 'vuex-class'
import Preferences from '@/renderer/preferences'
import { Entities } from '../database'
import NewShortcutDialog from './NewShortcutDialog.vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'

@Component({
    components: {
        NewShortcutDialog,
        ConfirmDialog
    }
})
export default class Shortcuts extends Vue {
    name = 'shortcuts'
    dialog = false
    editItem: Entities.Shortcut | null = null
    shortcuts: Entities.Shortcut[] = []
    headers = [
        {
            text: 'Name',
            value: 'name',
            align: 'center',
            sortable: false
        },
        {
            text: 'Absolute domain name',
            value: 'domain',
            align: 'center',
            sortable: false
        },
        {
            text: 'Actions',
            value: 'name',
            align: 'center',
            sortable: false
        }
    ]

    created() {
        this.loadList()
    }

    onEdit(val: Entities.Shortcut) {
        this.editItem = val
        this.dialog = true
    }

    onUpdate(shortcut: Entities.Shortcut) {
        const index = this.shortcuts.findIndex(item => {
            return item.id === shortcut.id
        })

        this.$set(this.shortcuts, index, shortcut)
    }
    onCancelEdit() {
        this.editItem = null
    }

    async onDelete(item: Entities.Shortcut) {
        let conDig = this.$refs.confirm as ConfirmDialog
        conDig.confirm().then(
            () => {
                return DB.preferences.delete(item.id as any)
            },
            () => {
                console.log('cancel')
            }
        )
    }

    @State
    preferencesRevision!: number

    @Watch('preferencesRevision')
    async loadList() {
        this.shortcuts = await DB.preferences
            .where('key')
            .equals('shortcut')
            .reverse()
            .sortBy('id')
    }
}
</script>
