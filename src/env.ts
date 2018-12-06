import * as Path from 'path'
import * as UrlUtils from '@/common/url-utils'

const devMode = process.env.NODE_ENV !== 'production'

const env = {
    devMode,

    index: devMode ?
        'http://localhost:9080/' :
        UrlUtils.filePathToUrl(Path.resolve(__dirname, 'index.html')),

    preload: UrlUtils.filePathToUrl(devMode ?
        Path.resolve(__dirname, '..', 'dist', 'electron', 'preload.js') :
        Path.resolve(__dirname, 'preload.js')),

    xWorker: UrlUtils.filePathToUrl(devMode ?
        Path.resolve(__dirname, '..', 'dist', 'electron', 'x-worker.html') :
        Path.resolve(__dirname, 'x-worker.html')),
}

export default env
