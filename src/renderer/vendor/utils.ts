import { cry } from 'thor-devkit'

function assert(cond: boolean, msg: string) {
    if (!cond) {
        throw new Error(msg)
    }
}

function isHex(str: string) {
    return /^0x[0-9a-f]*$/i.test(str)
}


export function normalizeMsg(msg: Connex.Vendor.SigningService.Message<'tx'>) {
    assert(typeof msg === 'object', 'expected object')
    assert(Array.isArray(msg.clauses), 'clauses expected array')
    return {
        clauses: msg.clauses.map((c, i) => {
            c = { ...c }
            c.to = c.to || null
            c.value = c.value || 0
            c.data = c.data || '0x'
            c.comment = c.comment || ''

            if (c.to) {
                assert(cry.isAddress(c.to), `clauses#${i}.to expected address or null`)
            }

            if (c.value) {
                assert(typeof c.value === 'string' || typeof c.value === 'number',
                    `clauses#${i}.value expected string or number`)
                if (typeof c.value === 'string') {
                    assert(isHex(c.value) && c.value.length > 2,
                        `clauses#${i}.value expected non-negative integer in hex string`)
                    c.value = c.value.toLowerCase()
                } else {
                    assert(Number.isSafeInteger(c.value) && c.value >= 0,
                        `clauses#${i} expected non-negative safe integer`)
                }
            }

            assert(isHex(c.data) && c.data.length % 2 === 0,
                `clauses#${i} expected odd hex string`)

            assert(typeof c.comment === 'string', `clauses#${i} expected string`)
            return c
        }),
        comment: msg.comment || ''
    }
}

export function normalizeTxSignOptions(options?: Connex.Vendor.SigningService.Options<'tx'>) {
    options = { ...(options || {}) }
    options.signer = options.signer || undefined

    if (options.signer) {
        assert(cry.isAddress(options.signer), 'options.signer expected address')
    }

    if (options.gas) {
        assert(Number.isSafeInteger(options.gas) && options.gas >= 0,
            'options.gas expected non-negative safe integer')
    }
    return options
}


export function describe(clauses: Connex.Vendor.SigningService.Message<'tx'>['clauses']) {
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
