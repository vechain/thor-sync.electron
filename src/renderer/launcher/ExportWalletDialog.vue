<template>
    <v-dialog v-model="show" v-bind="$attrs" v-on="$listeners" max-width="500px">
        <slot slot="activator" name="activator"/>
        <v-card>
            <v-card-title>
                <h3 class="headline mb-0">Export Keystore</h3>
            </v-card-title>
            <v-card-text>
                <v-text-field
                    :error="error.isError"
                    :error-messages="error.messages"
                    type="password"
                    label="Password"
                    v-model="password"
                ></v-text-field>
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn flat @click="close">Cancel</v-btn>
                <v-btn flat @click="exportKs" color="primary">Export</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>
<script lang="ts">
    import { Vue, Component, Watch, Prop } from 'vue-property-decorator'
    import { cry } from 'thor-devkit'
    import { Keystore } from 'thor-devkit/dist/lib/crypto'
    import { Entities } from '@/renderer/database'
    import { remote } from 'electron'
    import { mkdir } from 'fs'
    import { thistle } from 'color-name'
    const Path = require('path')
    const mkdirp = require('mkdirp')
    const fs = require('fs')
    @Component
    export default class ExportWalletDialog extends Vue {
        @Prop(String)
        address!: string
        password: string = ''
        show = false
        ks = ''

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
                this.password = ''
            }
        }

        close() {
            this.ks = ''
            this.show = false
            this.error = {
                isError: false,
                messages: []
            }
        }

        get filenName() {
            var ts = new Date()
            return [
                'UTC--',
                ts.toJSON().replace(/:/g, '-'),
                '--',
                this.address
            ].join('')
        }

        async exportKs() {
            const item: Entities.Wallet | undefined = await DB.wallets
                .where('address')
                .equals(this.address)
                .first()
            const ks: Keystore | null = item!.keystore || null
            if (ks) {
                try {
                    await cry.Keystore.decrypt(ks, this.password)
                } catch (error) {
                    this.error.isError = true
                    this.error.messages =['Password is invalid']
                    console.error(error)
                    return
                }

                try {
                    this.ks = JSON.stringify(ks)
                    await this.saveFile()
                    this.close()
                } catch (error) {
                    console.error(error)
                }
            }
        }

        writeFile(path: string) {
            if (path) {
                mkdir(Path.dirname(path), () => {
                    fs.writeFile(path, this.ks, 'utf8', (err: Error) => {
                        if (err) {
                            console.error(err)
                        }
                    })
                })
            }
        }

        async saveFile() {
            const defaultPath = Path.join(
                remote.app.getPath('documents'),
                this.filenName + '.txt'
            )
            await remote.dialog.showSaveDialog(
                remote.getCurrentWindow(),
                {
                    title: 'Save Keystore',
                    defaultPath: defaultPath
                },
                this.writeFile
            )
        }
    }
</script>

