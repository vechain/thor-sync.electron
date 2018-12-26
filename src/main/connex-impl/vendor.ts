import { app, BrowserWindow, WebContents } from 'electron'
import * as V from '@/common/validator'
import { ensure } from './ensure'
import { RLP } from 'thor-devkit'

const toKind = new RLP.NullableFixedBlobKind(20)
const valueKind = new RLP.NumericKind(32)
const dataKind = new RLP.BlobKind()

function normalizeTxMessage(msg: Connex.Vendor.SigningService.TxMessage): Connex.Vendor.SigningService.TxMessage {
    ensure(Array.isArray(msg), 'expected array')

    return msg.map((c, i) => {
        c = { ...c }
        c.to = c.to || null
        c.value = c.value || 0
        c.data = c.data || '0x'
        c.comment = c.comment || ''

        toKind.data(c.to, `#${i}.to`)
        valueKind.data(c.value, `#${i}.value`)
        dataKind.data(c.data, `#${i}.data`)

        ensure(typeof c.comment === 'string', `#${i}.comment expected string`)
        return c
    })
}

function normalizeCertMessage(msg: Connex.Vendor.SigningService.CertMessage) {
    ensure(typeof msg === 'object', 'expected object')
    ensure(msg.purpose === 'agreement' || msg.purpose === 'identification', 'purpose unsupported')
    ensure(typeof msg.payload === 'object', 'payload expected object')
    ensure(msg.payload.type === 'text', 'payload.type unsupported')
    ensure(typeof msg.payload.content === 'string', 'payload.content expected string')
    return msg
}


export function create(contents: WebContents): Connex.Vendor {
    const windowId = BrowserWindow.fromWebContents(contents.hostWebContents || contents).id
    return {
        sign: kind => {
            if (kind === 'tx') {
                const opts: VendorInterface.SignTxOptions = {}
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
                    request(msg) {
                        return app.vendor[windowId].signTx(
                            contents.id,
                            normalizeTxMessage(msg),
                            opts,
                            { url: contents.getURL(), title: contents.getTitle() })
                    }
                }
                return ss
            } else if (kind === 'cert') {
                const opts: VendorInterface.SignCertOptions = {}
                const ss: Connex.Vendor.CertSigningService = {
                    signer(addr: string) {
                        ensure(V.isAddress(addr), `'signer' expected address type`)
                        opts.signer = addr
                        return this
                    },
                    request(msg) {
                        return app.vendor[windowId].signCert(
                            contents.id,
                            normalizeCertMessage(msg),
                            opts,
                            { url: contents.getURL(), title: contents.getTitle() }
                        )
                    }
                }
                return ss as any
            }
            throw new Error('unsupported message kind')
        }
    }
}
