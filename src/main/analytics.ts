import env from '@/env'
import * as Path from 'path'
import { app } from 'electron'
import { readFile, writeFile } from 'fs'
import UUID from 'uuid'
import * as log from 'electron-log'

export class Analytics {
    private readonly ga: any
    private clientId?: string
    constructor() {
        // tslint:disable-next-line:variable-name
        const GA = require('electron-google-analytics')
        this.ga = new GA.default('UA-132391998-1', { debug: env.devMode })
    }

    public initClientId() {
        const path = Path.resolve(app.getPath('userData'), 'client-id')
        return new Promise<string>(resolve => {
            if (this.clientId) {
                return resolve(this.clientId)
            }
            readFile(path, 'utf8', (err, data) => {
                if (this.clientId) {
                    return resolve(this.clientId)
                }
                if (err) {
                    this.clientId = UUID.v4()
                    writeFile(path, this.clientId, 'utf8', _err => {
                        if (_err) {
                            log.error('failed to write client id', _err)
                        }
                    })
                    return resolve(this.clientId)
                }
                this.clientId = data
                return resolve(data)
            })
        })
    }

    public startup() {
        this.initClientId().then(id => {
            this.ga.event(`app-${app.getVersion()}`, 'startup', { evLabel: process.platform, clientID: id })
        })
    }
}

