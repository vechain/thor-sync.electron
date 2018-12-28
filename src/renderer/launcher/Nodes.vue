<template>
    <v-layout column>
        <v-subheader>
            <span class="subheading">Nodes</span>
            <v-spacer/>
            <v-btn flat @click.stop="dialog = true" color="primary" class="mr-4" icon>
                <v-icon color="primary">add</v-icon>
            </v-btn>
        </v-subheader>
        <v-card>
            <v-list two-line subheader>
                <div v-for="(item, index) in initNodes" :key="`${index}-origin`">
                    <v-list-tile avatar>
                        <v-list-tile-content>
                            <v-list-tile-title>
                                <NetworkName :genesis="item.genesis.id"/>
                                <span class="body-2">{{item.name}}</span>
                            </v-list-tile-title>
                            <v-list-tile-sub-title>{{item.url}}</v-list-tile-sub-title>
                        </v-list-tile-content>
                    </v-list-tile>
                    <v-divider v-if="index !== (initNodes.length - 1)"></v-divider>
                </div>
                <v-divider v-if="!!nodes.length"></v-divider>
                <div v-for="(item, index) in nodes" :key="`${index}-node`">
                    <v-list-tile avatar>
                        <v-list-tile-content>
                            <v-list-tile-title>
                                <NetworkName :genesis="item.value.genesis.id"/>
                                <span class="body-2">{{item.value.name}}</span>
                            </v-list-tile-title>
                            <v-list-tile-sub-title>{{item.value.url}}</v-list-tile-sub-title>
                        </v-list-tile-content>
                        <v-list-tile-action>
                            <v-btn
                                small
                                color="primary"
                                class="font-weight-regular"
                                flat
                                @click="onEdit(item)"
                                ripple
                            >Edit</v-btn>
                        </v-list-tile-action>
                    </v-list-tile>
                    <v-divider v-if="index !== (nodes.length - 1)"></v-divider>
                </div>
            </v-list>
        </v-card>
        <NewNodeDialog @cancel="onCancelEdit" :editItem="editItem" v-model="dialog"/>
    </v-layout>
</template>
<script lang="ts">
    import { Vue, Component, Watch, Mixins } from 'vue-property-decorator'
    import { State } from 'vuex-class'
    import { Entities } from '../database'
    import NewNodeDialog from './NewNodeDialog.vue'
    import ConfirmDialog from '../components/ConfirmDialog.vue'
    import { presets } from '@/node-configs'
    import Store from '@/renderer/store'

    @Component({
        components: {
            NewNodeDialog,
            ConfirmDialog
        }
    })
    export default class Nodes extends Vue {
        dialog = false
        editItem: Entities.Preference | null = null
        initNodes = presets
        get nodes() {
            return (this.$store as Store).state.nodes
        }

        onEdit(network: Entities.Preference) {
            this.editItem = network
            this.dialog = true
        }
        onCancelEdit() {
            this.editItem = null
        }
    }
</script>
