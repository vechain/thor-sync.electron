import { Vue } from 'vue-property-decorator'
import { remote, ipcRenderer } from 'electron'
import { GlobalDatabase, BoundedDatabase } from './database'
import env from '@/env'
import { trackTxLoop } from './tx-utils'

// widgets to be bound onto window.
// widgets names should be full caps.
declare global {
    interface Window {
        readonly ENV: typeof env
        readonly GDB: GlobalDatabase
        readonly BDB: BoundedDatabase
        // event bus
        readonly BUS: Vue
        readonly TXER: Txer
    }
    const ENV: typeof env
    const GDB: GlobalDatabase
    const BDB: BoundedDatabase
    const BUS: Vue
    const TXER: Txer
}

{
    const { connex, txer } = remote.app.EXTENSION.connect(
        remote.getCurrentWebContents().id,
        remote.getCurrentWebContents().getWebPreferences().nodeConfig!
    )
    Object.defineProperty(window, 'connex', {
        value: connex,
        enumerable: true
    })
    Object.defineProperty(window, 'TXER', {
        value: txer,
        enumerable: true
    })
}

// bind widgets
Object.defineProperty(window, 'ENV', {
    value: env,
    enumerable: true
})
Object.defineProperty(window, 'GDB', {
    value: new GlobalDatabase(),
    enumerable: true
})
Object.defineProperty(window, 'BDB', {
    value: new BoundedDatabase(remote.getCurrentWebContents().getWebPreferences().nodeConfig!.genesis.id),
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

document.addEventListener('dragover', ev => ev.preventDefault())
document.addEventListener('drop', ev => ev.preventDefault())

trackTxLoop()
