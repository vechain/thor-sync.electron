import { app, BrowserWindow, WebContents } from 'electron'

export function create(contents: WebContents): Connex.Vendor {
    const windowId = BrowserWindow.fromWebContents(contents.hostWebContents || contents).id
    return {
        sign: kind => {
            if (kind === 'tx') {
                const opts: SignTx.Options = {}
                const ss: Connex.Vendor.TxSigningService = {
                    signer(addr) {
                        opts.signer = addr
                        return this
                    },
                    gas(gas) {
                        opts.gas = gas
                        return this
                    },
                    link(url) {
                        opts.link = url
                        return this
                    },
                    comment(text) {
                        opts.comment = text
                        return this
                    },
                    request(msg: Connex.Vendor.SigningService.TxMessage) {
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
