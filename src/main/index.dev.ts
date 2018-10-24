/**
 * This file is used specifically and only for development. It installs
 * `electron-debug` & `vue-devtools`. There shouldn't be any need to
 *  modify this file, but it can be used to extend your development
 *  environment.
 */

import { app } from 'electron'

// Install `electron-debug` with `devtron`
// tslint:disable-next-line:no-var-requires
require('electron-debug')({ showDevTools: false })

// Install `vue-devtools`
app.on('ready', () => {
    const installExtension = require('electron-devtools-installer')
    installExtension
        .default(installExtension.VUEJS_DEVTOOLS)
        .then(() => {
            // tslint:disable-next-line:no-console
            console.log('install vue-devtools')
        })
        .catch((err: Error) => {
            // tslint:disable-next-line:no-console
            console.log('Unable to install `vue-devtools`: \n', err)
        })
})

// Require `main` process to boot app
import './index'
