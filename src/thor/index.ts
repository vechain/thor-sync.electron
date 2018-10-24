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
        call(input, options) {
            input = { ...input, value: input.value ? input.value.toString() : '0x' }
            options = options || {}
            const revision = options.revision
            return wire.post<Thor.VMOutput>(
                `accounts`,
                input,
                { revision })
        }
    }
}
