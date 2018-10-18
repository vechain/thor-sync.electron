<template>
    <v-container>
        <v-toolbar dark>
            <v-toolbar-title>Shortcuts</v-toolbar-title>
            <v-divider class="mx-3" inset vertical></v-divider>
            <span>
                Your favourite DApp will appear below
            </span>
            <v-spacer />
            <v-dialog persistent v-model="dialog" max-width="500px">
                <v-btn slot="activator" color="primary darken-1" dark class="mb-2">New Item</v-btn>
                <v-card>
                    <v-card-title>
                        <span class="headline">New Shortcut</span>
                    </v-card-title>
                    <v-card-text>
                        <v-container grid-list-md>
                            <v-layout wrap>
                                <v-flex xs12 sm6 md4>
                                    <!-- <v-text-field v-model="editedItem.name" label="Dessert name"></v-text-field> -->
                                </v-flex>
                                <v-flex xs12 sm6 md4>
                                    <!-- <v-text-field v-model="editedItem.calories" label="Calories"></v-text-field> -->
                                </v-flex>
                            </v-layout>
                        </v-container>
                    </v-card-text>
                    <v-card-actions>
                        <v-spacer></v-spacer>
                        <v-btn color="primary darken-1" flat @click.native="dialog = false">Cancel</v-btn>
                        <v-btn color="primary darken-1" flat @click.native="dialog = false">Save</v-btn>
                    </v-card-actions>
                </v-card>
            </v-dialog>
        </v-toolbar>
        <v-data-table dark width="800px" :headers="headers" :items="list">
            <template slot="items" slot-scope="props">
                <td>{{props.item.name}}</td>
                <td>{{props.item.domain}}</td>
                <td></td>
            </template>
        </v-data-table>
    </v-container>
</template>
<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'
import { State } from 'vuex-class'
import Preferences from '@/renderer/preferences'

@Component
export default class Shortcuts extends Vue {
    name = 'shortcuts'
    dialog = false
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

    @State
    list!: Settings.Shortcut[]
}
</script>
