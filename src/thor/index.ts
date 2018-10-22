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
        account(addr, revision) {
            return createAccountVisitor(wire, addr, revision)
        },
        block(revision) {
            return createBlockVisitor(wire, revision)
        },
        transaction(id, head) {
            return createTxVisitor(wire, id, head)
        },
        filter(kind, criteriaSet) {
            return createFilter(wire, kind, criteriaSet)
        },
        subscribe(subject, criteria) {
            return createSubscription(wire, subject, criteria)
        },
        call(input, revision) {
            input = { ...input, value: input.value ? input.value.toString() : '0x' }
            return wire.post<Thor.VMOutput>(
                `accounts`,
                input,
                { revision })
        }
    }
}
