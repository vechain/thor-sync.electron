import { createAccountVisitor } from './account-visitor'
import { createBlockVisitor } from './block-visitor'
import { createTxVisitor } from './tx-visitor'
import { createFilter } from './filter'
import cloneDeep from 'lodash.clonedeep'

export function create(
    node: Thor.Node,
    // cache: Thor.Cache
): Connex.Thor {
    const genesis = cloneDeep(node.config.genesis)
    const wire = node.createWire()
    return {
        get genesis() { return genesis },
        get status() { return node.status },
        ticker: () => {
            let lastKnownBlockId = node.status.head.id
            return {
                next: async () => {
                    if (lastKnownBlockId !== node.status.head.id) {
                        lastKnownBlockId = node.status.head.id
                        return
                    }
                    await node.nextTick()
                    lastKnownBlockId = node.status.head.id
                }
            }
        },
        account: (addr) => {
            return createAccountVisitor(wire, addr)
        },
        block: revision => {
            return createBlockVisitor(wire, revision)
        },
        transaction: (id) => {
            return createTxVisitor(wire, id)
        },
        filter: kind => {
            return createFilter(wire, kind)
        },
        explain: () => {
            const opts: {
                caller?: string
                gas?: number
                gasPrice?: string
            } = {}
            let revision: string | number | undefined
            return {
                caller(addr) {
                    opts.caller = addr
                    return this
                },
                gas(gas) {
                    opts.gas = gas
                    return this
                },
                gasPrice(gp) {
                    opts.gasPrice = gp
                    return this
                },
                revision(rev) {
                    revision = rev
                    return this
                },
                execute(clauses) {
                    const body = {
                        clauses: clauses.map(c => ({
                            to: c.to,
                            value: c.value.toString(),
                            data: c.data
                        })),
                        ...opts
                    }
                    return wire.post<Connex.Thor.VMOutput[]>(
                        `accounts/*`,
                        body,
                        { revision })
                }
            }
        }
    }
}

