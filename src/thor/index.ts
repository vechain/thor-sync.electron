import Thor = Connex.Thor
import { createAccountVisitor } from './account-visitor'
import { createBlockVisitor } from './block-visitor'
import { createTxVisitor } from './tx-visitor'
import { createSubscription } from './subscription'
import { createFilter } from './filter'

export function create(
    site: Thor.Site
): Thor {
    const wire = site.createWire()
    return {
        get genesis() { return site.config.genesis },
        get status() { return site.status },
        ticker() {
            let lastKnownBlockNum = site.status.head.number
            return {
                next() {
                    if (lastKnownBlockNum !== site.status.head.number) {
                        lastKnownBlockNum = site.status.head.number
                        return Promise.resolve()
                    }
                    return site.nextTick().then(() => {
                        lastKnownBlockNum = site.status.head.number
                    })
                }
            }
        },
        account(addr, options) {
            return createAccountVisitor(wire, addr, options || {})
        },
        block(revision) {
            return createBlockVisitor(wire, revision)
        },
        transaction(id, options) {
            return createTxVisitor(wire, id, options || {})
        },
        filter(kind, criteriaSet) {
            return createFilter(wire, kind, criteriaSet)
        },
        subscribe(subject, criteria, options) {
            return createSubscription(wire, subject, criteria, options || {})
        },
        explain(clauses, options) {
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
            return wire.post<Thor.VMOutput[]>(
                `accounts/*`,
                body,
                { revision })
        }
    }
}
