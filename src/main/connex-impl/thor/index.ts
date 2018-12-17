import { createAccountVisitor } from './account-visitor'
import { createBlockVisitor } from './block-visitor'
import { createTxVisitor } from './tx-visitor'
import { createFilter } from './filter'
import cloneDeep from 'lodash.clonedeep'
import * as V from '@/common/validator'
import { ensure } from '../ensure'

export function create(
    node: Thor.Node,
    cache: Thor.Cache
): Connex.Thor {
    const genesis = cloneDeep(node.genesis)
    const wire = node.createWire()
    return {
        get genesis() { return genesis },
        get status() {
            return {
                head: {
                    ...node.head
                },
                progress: node.progress
            }
        },
        ticker: () => {
            let lastHeadId = node.head.id
            return {
                next: async () => {
                    if (lastHeadId !== node.head.id) {
                        lastHeadId = node.head.id
                        return
                    }
                    await node.nextTick()
                    lastHeadId = node.head.id
                }
            }
        },
        account: (addr) => {
            ensure(V.isAddress(addr), `'addr' is not valid`)
            return createAccountVisitor(wire, cache, addr)
        },
        block: revision => {
            if (typeof revision === 'string') {
                ensure(V.isBytes32(revision), `'revision' is not valid block id`)
            } else if (typeof revision === 'number') {
                ensure(V.isUint32(revision), `'revision' is not valid block number`)
            } else if (typeof revision === 'undefined') {
                revision = node.head.id
            } else {
                ensure(false, `'revision' has invalid type`)
            }
            return createBlockVisitor(wire, cache, revision)
        },
        transaction: id => {
            ensure(V.isBytes32(id), `'id' is not valid`)
            return createTxVisitor(wire, cache, id)
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
            return {
                caller(addr) {
                    ensure(V.isAddress(addr), `'addr' is not valid`)
                    opts.caller = addr
                    return this
                },
                gas(gas) {
                    ensure(gas >= 0 && Number.isSafeInteger(gas), `'gas' expected integer >= 0`)
                    opts.gas = gas
                    return this
                },
                gasPrice(gp) {
                    ensure(V.isDecString(gp) || V.isHexString(gp), `'gasPrice' expected integer in hex/dec string`)
                    opts.gasPrice = gp
                    return this
                },
                execute(clauses) {
                    ensure(Array.isArray(clauses), `'clauses' expected array`)

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
                        { revision: node.head.id })
                }
            }
        }
    }
}

