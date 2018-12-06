import { cry, RLP } from 'thor-devkit'

function assert(cond: boolean, msg: string) {
    if (!cond) {
        throw new Error(msg)
    }
}

const toKind = new RLP.NullableFixedBlobKind(20)
const valueKind = new RLP.NumericKind(32)
const dataKind = new RLP.BlobKind()

export function normalizeMsg(msg: Connex.Vendor.SigningService.TxMessage) {
    assert(Array.isArray(msg), 'expected array')

    return msg.map((c, i) => {
        c = { ...c }
        c.to = c.to || null
        c.value = c.value || 0
        c.data = c.data || '0x'
        c.comment = c.comment || ''

        toKind.data(c.to, `#${i}.to`)
        valueKind.data(c.value, `#${i}.value`)
        dataKind.data(c.data, `#${i}.data`)

        assert(typeof c.comment === 'string', `#${i}.comment expected string`)
        return c
    })
}

export function normalizeTxSignOptions(options?: SignTx.Options) {
    options = { ...(options || {}) }
    options.signer = options.signer || undefined
    options.comment = options.comment || ''

    if (options.signer) {
        assert(cry.isAddress(options.signer), 'signer expected address')
    }

    if (options.gas) {
        assert(Number.isSafeInteger(options.gas) && options.gas >= 0,
            'gas expected non-negative safe integer')
    }
    return options
}


export function describe(clauses: Connex.Vendor.SigningService.TxMessage) {
    if (clauses.length === 0) {
        return 'empty'
    }
    if (clauses.length === 1) {
        if (!clauses[0].to) {
            return 'to create a contract'
        }
        if (clauses[0].data === '0x') {
            return 'to transfer value'
        }
        return 'to make contract call'
    }

    return 'to perform a batch of actions'
}
