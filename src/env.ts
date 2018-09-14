import * as Path from 'path'
import { URL } from 'url'
const devMode = process.env.NODE_ENV !== 'production'

function filePathToUrl(path: string) {
    return new URL(`file:///${path}`).href
}

const env = {
    devMode,
    index: devMode ?
        'http://localhost:9080/' :
        filePathToUrl(Path.resolve(__dirname, 'index.html')),

    preload: filePathToUrl(devMode ?
        Path.resolve(__dirname, '..', 'dist', 'electron', 'preload.js') :
        Path.resolve(__dirname, 'preload.js')),

    dapps: devMode ?
        'http://localhost:9090/' :
        filePathToUrl(Path.resolve(__dirname, 'dapps/'))
}

export default env
