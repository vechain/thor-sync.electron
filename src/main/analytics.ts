import env from '@/env'
import * as Path from 'path'
import { app } from 'electron'
import { readFile, writeFile } from 'fs'
import UUID from 'uuid'
import * as log from 'electron-log'
import { lookup } from 'dns'

export class Analytics {
    private readonly ga: any
    private clientId?: string
    constructor(userAgent: string) {
        // tslint:disable-next-line:variable-name
        const GA = require('electron-google-analytics')
        this.ga = new GA.default('UA-132391998-1', { debug: env.devMode, userAgent })
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
            const report = (action: string) => {
                lookup('www.google-analytics.com', err => {
                    if (err) {
                        return
                    }
                    this.ga.event(
                        `app-${app.getVersion()}`,
                        action,
                        { clientID: id })
                })
            }

            report('startup')
            setInterval(
                () => report('remain'),
                12 * 3600 * 1000
            )
        })
    }
}

