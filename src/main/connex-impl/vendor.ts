import { app, BrowserWindow, WebContents } from 'electron'
import * as V from '@/common/validator'
import { ensure } from './ensure'

export function create(contents: WebContents): Connex.Vendor {
    const windowId = BrowserWindow.fromWebContents(contents.hostWebContents || contents).id
    return {
        sign: kind => {
            if (kind === 'tx') {
                const opts: SignTx.Options = {}
                const ss: Connex.Vendor.TxSigningService = {
                    signer(addr) {
                        ensure(V.isAddress(addr), `'signer' expected address type`)
                        opts.signer = addr
                        return this
                    },
                    gas(gas) {
                        ensure(gas >= 0 && Number.isSafeInteger(gas), `'gas' expected non-neg safe integer`)
                        opts.gas = gas
                        return this
                    },
                    link(url) {
                        // TODO validate url
                        opts.link = url
                        return this
                    },
                    comment(text) {
                        ensure(typeof text === 'string', `'comment' expected string`)
                        opts.comment = text
                        return this
                    },
                    request(msg: Connex.Vendor.SigningService.TxMessage) {
                        // TODO validate msg
                        return app.vendor[windowId].signTx(
                            contents.id,
                            msg,
                            opts,
                            { url: contents.getURL(), title: contents.getTitle() })
                    }
                }
                return ss as any
            }
            throw new Error('unsupported')
        }
    }
}
