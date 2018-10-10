import * as Path from 'path'
import { URL } from 'url'
import { remote } from 'electron'

const devMode = process.env.NODE_ENV !== 'production'

function filePathToUrl(path: string) {
    return new URL(`file:///${path}`).href
}

const env = {
    devMode,
    clientId: remote ? remote.getCurrentWebContents().getWebPreferences()['xargs.clientId'] : undefined,
    config: remote ? remote.getCurrentWebContents().getWebPreferences()['xargs.config'] : undefined,
    contentsId: remote ? remote.getCurrentWebContents().id : undefined,

    index: devMode ?
        'http://localhost:9080/' :
        filePathToUrl(Path.resolve(__dirname, 'index.html')),

    preload: filePathToUrl(devMode ?
        Path.resolve(__dirname, '..', 'dist', 'electron', 'preload.js') :
        Path.resolve(__dirname, 'preload.js')),

    xWorker: filePathToUrl(devMode ?
        Path.resolve(__dirname, '..', 'dist', 'electron', 'x-worker.html') :
        Path.resolve(__dirname, 'x-worker.html')),

    dapps: devMode ?
        'http://localhost:9090/' :
        filePathToUrl(Path.resolve(__dirname, 'dapps')) + '/'
}

export default env
