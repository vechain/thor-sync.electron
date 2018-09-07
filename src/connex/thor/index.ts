import Thor = Connex.Thor
import Endpoint from './endpoint'
import * as AccountVisitor from './account-visitor'
import * as BlockVisitor from './block-visitor'
import * as TxVisitor from './tx-visitor'
import * as Filter from './filter'
import * as Subscription from './subscription'

export function create(
    baseURL: string,
    genesis: string,
    ticker?: () => Promise<Thor.Block>
): Thor {

    const ep = new Endpoint(baseURL)
    return {
        get genesis() { return genesis },
        async nextTick() {
            for (; ;) {
                if (!ticker) {
                    ticker = Subscription.create(ep, 'block', {}).next
                }
                try {
                    return await ticker()
                } catch {
                    ticker = undefined
                    await new Promise(resolve => setTimeout(resolve, 10 * 1000))
                }
            }
        },
        account(
            addr: string,
            revision?: string | number) {
            return AccountVisitor.create(ep, addr, revision)
        },
        block(revision: string | number) {
            return BlockVisitor.create(ep, revision)
        },
        transaction(
            id: string,
            head?: string) {
            return TxVisitor.create(ep, id, head)
        },
        filter<T extends 'event' | 'transfer'>(
            kind: T,
            criteriaSet: Array<Thor.Criteria<T>>) {
            return Filter.create(ep, kind, criteriaSet)
        },
        subscribe<T extends 'event' | 'transfer' | 'block'>(
            subject: T,
            criteria: Thor.Criteria<T>
        ) {
            return Subscription.create(ep, subject, criteria)
        },
        call(
            input: Thor.VMInput,
            revision?: string | number) {
            return ep.post<Thor.VMOutput>(
                `accounts`,
                input,
                { revision })
        },
        commit(rawTx: string) {
            return ep.post<{ id: string }>(
                'transactions',
                { raw: rawTx }
            ).then(r => TxVisitor.create(ep, r.id))
        }
    }
}
