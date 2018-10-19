<template>
    <v-container>
        <v-layout row justify-center>
            <v-flex sm12>
                <v-toolbar>
                    <v-toolbar-title>Shortcuts</v-toolbar-title>
                    <v-divider class="mx-3" inset vertical></v-divider>
                    <span>
                        Your favourite DApp will appear below
                    </span>
                    <v-spacer />
                    <NewShortcutDialog />
                </v-toolbar>
                <v-data-table width="800px" :headers="headers" :items="shortcuts">
                    <template slot="items" slot-scope="props">
                        <td class="text-xs-center">{{props.item.value.name}}</td>
                        <td class="text-xs-center">{{props.item.value.domain}}</td>
                        <td></td>
                    </template>
                </v-data-table>
            </v-flex>
        </v-layout>
    </v-container>
</template>
<script lang="ts">
import { Vue, Component, Watch } from 'vue-property-decorator'
import { State } from 'vuex-class'
import Preferences from '@/renderer/preferences'
import { Entities } from '../database'
import NewShortcutDialog from './NewShortcutDialog.vue'

@Component({
    components: {
        NewShortcutDialog
    }
})
export default class Shortcuts extends Vue {
    name = 'shortcuts'
    dialog = false
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

    @State shortcutsRevision!: number

    @Watch('shortcutsRevision')
    async loadList() {
        this.shortcuts = await DB.preferences.filter((item) => {
            return item.key === 'shortcut'
        }).toArray()
    }
}
</script>
