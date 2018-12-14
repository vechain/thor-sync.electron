import { createAccountVisitor } from './account-visitor'
import { createBlockVisitor } from './block-visitor'
import { createTxVisitor } from './tx-visitor'
import { createFilter } from './filter'
import cloneDeep from 'lodash.clonedeep'
import * as validator from './validator'

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
            validator.address(addr, `'addr' is not valid`)
            return createAccountVisitor(wire, cache, addr)
        },
        block: revision => {
            if (typeof revision === 'string') {
                validator.bytes32(revision, `'revision' is not valid block id`)
            } else if (typeof revision === 'number') {
                validator.blockNumber(revision, `'revision' is not valid block number`)
            } else if (typeof revision === 'undefined') {
                revision = node.head.id
            } else {
                throw new validator.BadParameter(`'revision' has invalid type`)
            }
            return createBlockVisitor(wire, cache, revision)
        },
        transaction: id => {
            validator.bytes32(id, `'id' is not valid`)
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
                    validator.address(addr, `'addr' is not valid`)
                    opts.caller = addr
                    return this
                },
                gas(gas) {
                    validator.gas(gas, `'gas' is not valid`)
                    opts.gas = gas
                    return this
                },
                gasPrice(gp) {
                    opts.gasPrice = gp
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
                        { revision: node.head.id })
                }
            }
        }
    }
}

