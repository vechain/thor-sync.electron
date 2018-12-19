<template>
    <DialogEx v-model="show" @action:cancel="show=false" max-width="500px">
        <v-card ref="card">
            <v-card-text>
                <div class="subheading font-weight-light">Export Wallet</div>
                <v-stepper class="elevation-0" v-model="step">
                    <v-stepper-header class="elevation-0">
                        <v-stepper-step :complete="step > 1" step="1"></v-stepper-step>
                        <v-divider></v-divider>
                        <v-stepper-step :complete="step > 2" step="2"></v-stepper-step>
                    </v-stepper-header>
                    <div
                        class="title font-weight-light pl-4"
                    >{{['Verify Password', 'Keystore'][step-1]}}</div>
                    <v-stepper-items>
                        <v-stepper-content step="1">
                            <v-card>
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
                                    <v-btn flat @click="checkPwd" color="primary">Next</v-btn>
                                </v-card-actions>
                            </v-card>
                        </v-stepper-content>
                        <v-stepper-content step="2">
                            <v-card>
                                <v-card-text>
                                    <v-textarea box v-model="ks"></v-textarea>
                                </v-card-text>
                                <v-card-actions>
                                    <v-spacer></v-spacer>
                                    <v-btn flat @click="close">Cancel</v-btn>
                                    <v-btn flat @click="save" color="primary">Save</v-btn>
                                </v-card-actions>
                            </v-card>
                        </v-stepper-content>
                    </v-stepper-items>
                </v-stepper>
            </v-card-text>
        </v-card>
    </DialogEx>
</template>
<script lang="ts">
    import { Vue, Component, Watch, Prop, Mixins } from 'vue-property-decorator'
    import { cry } from 'thor-devkit'
    import { Keystore } from 'thor-devkit/dist/lib/crypto'
    import { Entities } from '@/renderer/database'
    import { remote } from 'electron'
    import { mkdir } from 'fs'
    import AccountMixin from '@/renderer/mixins/Account'
    import DialogHelper from '@/renderer/mixins/dialog-helper'
    const Path = require('path')
    const mkdirp = require('mkdirp')
    const fs = require('fs')

    @Component
    export default class ExportWalletDialog extends Mixins(
        AccountMixin,
        class extends DialogHelper<Entities.Wallet, void> {}
    ) {
        password: string = ''
        show = false
        ks = ''
        step = 1

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
                this.result = null
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

        mounted() {
            this.show = true
            const ele = (this.$refs.card as Vue).$el.querySelector('input')
            setTimeout(()=> {
                ele!.focus()
            }, 0)
        }

        async onNext() {
            if (await this.checkPwd(this.password, this.arg.keystore)) {
                this.step = 2
            }
        }

        async save() {
            try {
                const path = await this.saveFile()
                await this.writeFile(path, this.ks)
                this.close()
            } catch (error) {
                console.error(error)
            }
            this.close()
        }

        async writeFile(path: string, ks: string) {
            return new Promise<void>((resolve, reject) => {
                if (path) {
                    mkdir(Path.dirname(path), () => {
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

        async saveFile() {
            return new Promise<string>((resolve, reject) => {
                const defaultPath = Path.join(
                    remote.app.getPath('documents'),
                    this.filenName() + '.txt'
                )

                remote.dialog.showSaveDialog(
                    remote.getCurrentWindow(),
                    {
                        title: 'Save Keystore',
                        defaultPath: defaultPath
                    },
                    (path: string) => {
                        resolve(path)
                    }
                )
            })
        }
    }
</script>

