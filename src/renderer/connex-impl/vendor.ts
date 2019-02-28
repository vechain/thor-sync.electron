import { remote } from 'electron'
import * as V from '@/common/validator'
import { ensure, BadParameter } from './ensure'
import { RLP } from 'thor-devkit'
import { ipcCall } from '../ipc'
import { remakeError } from '@/common/custom-error'

const wc = remote.getCurrentWebContents()
const hostWcId = (wc.hostWebContents || wc).id

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

        try {
            toKind.data(c.to, `#${i}.to`)
            valueKind.data(c.value, `#${i}.value`)
            dataKind.data(c.data, `#${i}.data`)
        } catch (err) {
            throw new BadParameter(err.message)
        }

        ensure(typeof c.comment === 'string', `'#${i}.comment' expected string`)
        return c
    })
}

function normalizeCertMessage(msg: Connex.Vendor.SigningService.CertMessage) {
    ensure(typeof msg === 'object', 'expected object')
    ensure(msg.purpose === 'agreement' || msg.purpose === 'identification',
        `'purpose' expected 'agreement' or 'identification'`)
    ensure(typeof msg.payload === 'object', `'payload' expected object`)
    ensure(msg.payload.type === 'text', `'payload.type' unsupported`)
    ensure(typeof msg.payload.content === 'string', `'payload.content' expected string`)
    return msg
}


export function create(): Connex.Vendor {
    return {
        sign: kind => {
            if (kind === 'tx') {
                const opts: SignTxOptions = {}
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
                        const arg: SignTxArg = {
                            message: normalizeTxMessage(msg),
                            options: opts,
                            referer: { url: wc.getURL(), title: wc.getTitle() }
                        }

                        return ipcCall({ webContentsId: hostWcId, channel: 'vendor' }, 'sign-tx', arg)
                            .catch(err => Promise.reject(remakeError(err)))
                    }
                }
                return ss
            } else if (kind === 'cert') {
                const opts: SignCertOptions = {}
                const ss: Connex.Vendor.CertSigningService = {
                    signer(addr: string) {
                        ensure(V.isAddress(addr), `'signer' expected address type`)
                        opts.signer = addr
                        return this
                    },
                    link(url) {
                        opts.link = url
                        return this
                    },
                    request(msg) {
                        const arg: SignCertArg = {
                            message: normalizeCertMessage(msg),
                            options: opts,
                            referer: { url: wc.getURL(), title: wc.getTitle() }
                        }
                        return ipcCall({ webContentsId: hostWcId, channel: 'vendor' }, 'sign-cert', arg)
                            .catch(err => Promise.reject(remakeError(err)))
                    }
                }
                return ss as any
            }
            throw new BadParameter('unsupported message kind')
        },
        owned: addr => {
            ensure(V.isAddress(addr), `'addr' expected address type`)
            return remote.app.EXTENSION.isWalletOwned(remote.getCurrentWindow().id, addr.toLowerCase())
        }
    }
}
