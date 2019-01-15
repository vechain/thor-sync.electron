<template>
    <div class="pa-3">
        <div style="max-width: 800px; width: 100%; margin: 0 auto;">
            <template v-for="(sec,i) in sections">
                <v-layout :key="i" align-end>
                    <v-subheader>{{sec.title}}</v-subheader>
                    <v-spacer/>
                    <v-btn
                        v-if="sec.action&&sec.actionName"
                        class="caption"
                        small
                        flat
                        color="primary"
                        style="text-transform:none"
                        @click="sec.action()"
                    >{{sec.actionName}}</v-btn>
                </v-layout>
                <v-list
                    :key="i+'items'"
                    two-line
                    style="border:1px solid rgba(0,0,0,0.1); border-radius:5px;"
                >
                    <template v-for="(item,j) in sec.items">
                        <v-divider v-if="j>0" :key="j+'d'"/>
                        <v-list-tile :key="j">
                            <v-list-tile-content>
                                <v-list-tile-title>
                                    <component
                                        v-if="item.prepend"
                                        :is="item.prepend.component"
                                        v-bind="item.prepend.props"
                                        class="mr-2"
                                    ></component>
                                    {{item.title}}
                                </v-list-tile-title>
                                <v-list-tile-sub-title>{{item.subTitle}}</v-list-tile-sub-title>
                            </v-list-tile-content>
                            <v-list-tile-action>
                                <v-btn
                                    v-if="item.actionName"
                                    class="ml-3"
                                    style="text-transform:none"
                                    :disabled="!item.action"
                                    flat
                                    small
                                    color="primary"
                                    @click="item.action()"
                                >{{item.actionName}}</v-btn>
                            </v-list-tile-action>
                        </v-list-tile>
                    </template>
                </v-list>
            </template>
        </div>
    </div>
</template>
<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'
import { remote } from 'electron'
import NewNodeDialog from '../components/NewNodeDialog.vue'
import { presets } from '@/node-configs'

type Item = {
    title: string
    prepend?: {
        component: string
        props: {}
    }
    subTitle?: string
    actionName?: string
    action?: () => void
}

type Section = {
    title: string
    actionName?: string
    action?: () => void
    items: Item[]
}

const issueUrl = 'https://github.com/vechain/thor-sync.electron/issues'
const version = `${remote.app.getName()} v${remote.app.getVersion()} / Connex v${connex.version}`
const updateChecker = remote.app.EXTENSION.updateChecker

@Component
export default class Settings extends Vue {
    updater = {
        status: updateChecker.status,
        newVersion: updateChecker.newVersion,
        error: updateChecker.error
    }

    get autoUpdateStatusText() {
        if (this.updater.status === 'downloaded' && this.updater.newVersion) {
            return `New version ${this.updater.newVersion.version} available!`
        }
        if (this.updater.error) {
            return 'Error occurred'
        }
        if (this.updater.status === 'idle') {
            return 'Already up to date'
        }
    }

    get autoUpdateActionName() {
        switch (this.updater.status) {
            case 'idle': return 'Check'
            case 'checking': return 'Checking…'
            case 'downloading': return 'Downloading…'
            case 'downloaded': return 'Quit and Install'
        }
    }

    get autoUpdateAction() {
        switch (this.updater.status) {
            case 'idle': return () => {
                updateChecker.check()
                this.updater = {
                    status: updateChecker.status,
                    newVersion: updateChecker.newVersion,
                    error: updateChecker.error
                }
            }
            case 'checking': return undefined
            case 'downloading': return undefined
            case 'downloaded': return () => updateChecker.quitAndInstall()
        }
    }

    get autoUpdateSubTitle() {
        const statusText = this.autoUpdateStatusText
        if (statusText) {
            return `${version} (${statusText})`
        }
        return version
    }

    get nodes(): Array<NodeConfig & { isPreset: boolean }> {
        return presets.map(n => ({ ...n, isPreset: true }))
            .concat(this.$store.state.nodes.map((n: NodeConfig) => ({ ...n, isPreset: false })))
    }

    get sections(): Section[] {
        return [{
            title: 'General',
            items: [{
                title: 'Auto Update',
                subTitle: this.autoUpdateSubTitle,
                actionName: this.autoUpdateActionName,
                action: this.autoUpdateAction
            }, {
                title: 'Report an Issue',
                subTitle: 'To Github Issues Page',
                actionName: 'Open',
                action: () => {
                    BUS.$emit('open-tab', {
                        href: issueUrl
                    })
                }
            }]
        }, {
            title: 'Nodes',
            actionName: 'Add Node',
            action: () => this.$dialog(NewNodeDialog, null),
            items: this.nodes.map(n => {
                return {
                    title: n.name,
                    prepend: {
                        component: 'NetworkName',
                        props: { genesis: n.genesis.id }
                    },
                    subTitle: n.url,
                    actionName: n.isPreset ? '' : 'Edit',
                    action: n.isPreset ? undefined : () => { this.$dialog(NewNodeDialog, n) }
                }
            })
        }]
    }

    timer: any

    created() {
        this.timer = setInterval(() => {
            this.updater = {
                status: updateChecker.status,
                newVersion: updateChecker.newVersion,
                error: updateChecker.error
            }
        }, 2000)
    }
    destroyed() {
        clearInterval(this.timer)
    }
}
</script>

