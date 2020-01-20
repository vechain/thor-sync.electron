<template>
    <DialogEx persistent v-model="show" @action:ok="onOk" @action:cancel="close" max-width="500px">
        <v-card ref="card">
            <v-card-title class="subheading">Backup</v-card-title>
            <v-card-text class="py-0">
                <v-textarea
                    v-focus
                    class="caption"
                    label="Keystore"
                    readonly
                    rows="12"
                    no-resize
                    box
                    v-model="ks"
                />
            </v-card-text>
            <v-divider />
            <v-card-actions>
                <v-btn small flat @click="close">Abort</v-btn>
                <v-spacer />
                <v-btn small ref="submit" flat @click="save" class="primary">Save</v-btn>
            </v-card-actions>
        </v-card>
    </DialogEx>
</template>
<script lang="ts">
import { Vue, Component, Watch, Prop, Mixins } from 'vue-property-decorator'
import { cry } from 'thor-devkit'
import { remote } from 'electron'
import AccountMixin from '@/renderer/mixins/Account'
import DialogHelper from '@/renderer/mixins/dialog-helper'
const Path = require('path')
const mkdirp = require('mkdirp')
const fs = require('fs')

@Component
export default class ExportWalletDialog extends Mixins(
    AccountMixin,
    class extends DialogHelper<entities.Wallet, void> {}
) {
    password: string = ''
    show = false
    ks = ''
    step = 1

    checking = false

    error: {
        isError: boolean
        messages: string[]
    } = {
        isError: false,
        messages: []
    }

    @Watch('show')
    showChanged(val: boolean) {
        if (!val) {
            this.$resolve(undefined)
        }
    }

    close() {
        this.show = false
    }

    filenName() {
        var ts = new Date()
        return [
            'UTC--',
            ts.toJSON().replace(/:/g, '-'),
            '--',
            this.arg.address
        ].join('')
    }

    created() {
        this.ks = JSON.stringify(this.arg.keystore, undefined, 2)
    }

    mounted() {
        this.show = true
    }

    async save() {
        try {
            const path = await this.saveFile()
            await this.writeFile(path, this.ks)
            this.close()
        } catch (error) {
            LOG.error(error)
        }
        this.close()
    }

    async writeFile(path: string, ks: string) {
        return new Promise<void>((resolve, reject) => {
            if (path) {
                mkdirp(Path.dirname(path), () => {
                    fs.writeFile(path, ks, 'utf8', (err: Error) => {
                        if (err) {
                            reject(err)
                        } else {
                            resolve()
                        }
                    })
                })
            }
        })
    }

    onOk() {
        const btn = (this.$refs.submit as Vue).$el
        btn.focus()
        btn.click()
    }

    async saveFile() {
        return new Promise<string>((resolve, reject) => {
            const defaultPath = Path.join(
                remote.app.getPath('documents'),
                this.filenName() + '.txt'
            )

            remote.dialog.showSaveDialog(remote.getCurrentWindow(), {
                title: 'Save Keystore',
                defaultPath: defaultPath
            }).then(r => {
                if (!r.canceled) {
                    resolve(r.filePath)
                }
            })
        })
    }
}
</script>

