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
        account(
            addr: string,
            revision?: string | number) {
            return createAccountVisitor(wire, addr, revision)
        },
        block(revision: string | number) {
            return createBlockVisitor(wire, revision)
        },
        transaction(
            id: string,
            head?: string) {
            return createTxVisitor(wire, id, head)
        },
        filter<T extends 'event' | 'transfer'>(
            kind: T,
            criteriaSet: Array<Thor.Criteria<T>>) {
            return createFilter(wire, kind, criteriaSet)
        },
        subscribe<T extends 'event' | 'transfer' | 'block'>(
            subject: T,
            criteria: Thor.Criteria<T>
        ) {
            return createSubscription(wire, subject, criteria)
        },
        call(
            input: Thor.VMInput,
            revision?: string | number) {
            return wire.post<Thor.VMOutput>(
                `accounts`,
                input,
                { revision })
        },
        commit(rawTx: string) {
            return wire.post<{ id: string }>(
                'transactions',
                { raw: rawTx }
            ).then(r => createTxVisitor(wire, r.id))
        }
    }
}
