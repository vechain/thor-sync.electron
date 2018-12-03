import { createAccountVisitor } from './account-visitor'
import { createBlockVisitor } from './block-visitor'
import { createTxVisitor } from './tx-visitor'
import { createFilter } from './filter'
import { Site } from './site'

export function create(
    site: Site
): Connex.Thor {
    const wire = site.createWire()
    return {
        get genesis() { return site.config.genesis },
        get status() { return site.status },
        ticker: () => {
            let lastKnownBlockNum = site.status.head.number
            return {
                next: async () => {
                    if (lastKnownBlockNum !== site.status.head.number) {
                        lastKnownBlockNum = site.status.head.number
                        return
                    }
                    await site.nextTick()
                    lastKnownBlockNum = site.status.head.number
                }
            }
        },
        account: (addr, options) => {
            return createAccountVisitor(wire, addr, options || {})
        },
        block: revision => {
            return createBlockVisitor(wire, revision)
        },
        transaction: (id, options) => {
            return createTxVisitor(wire, id, options || {})
        },
        filter: kind => {
            return createFilter(wire, kind)
        },
        explain: (clauses, options) => {
            options = options || {}
            const body = {
                clauses: clauses.map(c => ({
                    to: c.to,
                    value: c.value.toString(),
                    data: c.data
                })),
                gas: options.gas,
                gasPrice: options.gasPrice,
                caller: options.caller
            }
            const revision = options.revision
            return wire.post<Connex.Thor.VMOutput[]>(
                `accounts/*`,
                body,
                { revision })
        }
    }
}

export * from './site'
