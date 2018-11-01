import { Vue } from 'vue-property-decorator'
import { remote } from 'electron'
import Database from './database'
import env from '@/env'

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


const win = remote.getCurrentWindow()
const style = 'full-screen'
const bodyEle = document.body
const platform = process.platform

bodyEle.classList.add(platform)
if (win.isFullScreen()) {
    bodyEle.classList.add(style)
} else {
    bodyEle.classList.remove(style)
}

win.on('enter-full-screen', () => {
    bodyEle.classList.add(style)
})
win.on('leave-full-screen', () => {
    bodyEle.classList.remove(style)
})
