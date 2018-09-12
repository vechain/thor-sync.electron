import Thor = Connex.Thor
import { createAccountVisitor } from './account-visitor'
export function create(
    site: Thor.Site
): Thor {
    const wire = site.createWire()
    return {
        get genesisBlock() { return site.genesisBlock },
        get bestBlock() { return site.bestBlock },
        get syncProgress() { return site.syncProgress},
        nextTick() {
            return site.nextTick()
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
