import { Vue } from 'vue-property-decorator'
import { remote } from 'electron'
import Database from './database'
import env from '@/env'
import { trackTxLoop } from './tx-utils'

// widgets to be bound onto window.
// widgets names should be full caps.
declare global {
    interface Window {
        readonly ENV: typeof env
        readonly DB: Database
        // event bus
        readonly BUS: Vue
    }
    const ENV: typeof env
    const DB: Database
    const BUS: Vue
}

Object.defineProperty(window, 'connex', {
    value: remote.app.EXTENSION.connect(
        env.contents!.id,
        env.xargs!.config!,
        env.xargs!.clientId!),
    enumerable: true
})
// bind widgets
Object.defineProperty(window, 'ENV', {
    value: env,
    enumerable: true
})
Object.defineProperty(window, 'DB', {
    value: new Database(),
    enumerable: true
})
Object.defineProperty(window, 'BUS', {
    value: new Vue()
})

trackTxLoop()

const bodyElem = document.body
bodyElem.classList.add(process.platform)
const fullScreenClass = 'full-screen'
const blurClass = 'blur'

const win = remote.getCurrentWindow()
if (win.isFullScreen()) {
    bodyElem.classList.add(fullScreenClass)
}
if (!win.isFocused()) {
    bodyElem.classList.add(blurClass)
}
win.on('enter-full-screen', () => {
    bodyElem.classList.add(fullScreenClass)
}).on('leave-full-screen', () => {
    bodyElem.classList.remove(fullScreenClass)
}).on('focus', () => {
    bodyElem.classList.remove(blurClass)
}).on('blur', () => {
    bodyElem.classList.add(blurClass)
})
