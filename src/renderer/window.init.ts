import { Vue } from 'vue-property-decorator'
import { remote, ipcRenderer } from 'electron'
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
        remote.getCurrentWebContents().id,
        remote.getCurrentWebContents().getWebPreferences().siteConfig!
    ),
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
remote.app.EXTENSION.registerBrowserWindowEvent(win.id, [
    'enter-full-screen',
    'leave-full-screen',
    'focus',
    'blur',
    'scroll-touch-begin',
    'scroll-touch-end',
    'scroll-touch-edge'
])


const bodyElem = document.body
bodyElem.classList.add(process.platform)
const fullScreenClass = 'full-screen'
const blurClass = 'blur'

if (win.isFullScreen()) {
    bodyElem.classList.add(fullScreenClass)
}
if (!win.isFocused()) {
    bodyElem.classList.add(blurClass)
}

if (process.platform === 'darwin') {
    win.setSheetOffset(72)
}

ipcRenderer.on('browser-window-event', (_: any, event: string) => {
    switch (event) {
        case 'enter-full-screen':
            bodyElem.classList.add(fullScreenClass)
            break
        case 'leave-full-screen':
            bodyElem.classList.remove(fullScreenClass)
            break
        case 'focus':
            bodyElem.classList.remove(blurClass)
            break
        case 'blur':
            bodyElem.classList.add(blurClass)
            break
    }
})

trackTxLoop()
