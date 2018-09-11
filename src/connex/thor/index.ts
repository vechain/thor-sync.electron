import Thor = Connex.Thor
import * as AccountVisitor from './account-visitor'
import * as BlockVisitor from './block-visitor'
import * as TxVisitor from './tx-visitor'
import * as Filter from './filter'
import * as Subscription from './subscription'

export function create(
    network: Network
): Thor {
    const wire = network.createWire()
    return {
        get genesisBlock() { return network.genesisBlock },
        get bestBlock() { return network.bestBlock },
        get syncProgress() {
            const nowTs = Date.now()
            const bestBlockTs = network.bestBlock.timestamp * 1000
            if (nowTs - bestBlockTs < 30 * 1000) {
                return 1
            }
            const genesisBlockTs = network.genesisBlock.timestamp * 1000
            const progress = (bestBlockTs - genesisBlockTs) / (nowTs - genesisBlockTs)
            return progress < 0 ? NaN : progress
        },
        nextTick() {
            return network.nextTick()
        },
        account(
            addr: string,
            revision?: string | number) {
            return AccountVisitor.create(wire, addr, revision)
        },
        block(revision: string | number) {
            return BlockVisitor.create(wire, revision)
        },
        transaction(
            id: string,
            head?: string) {
            return TxVisitor.create(wire, id, head)
        },
        filter<T extends 'event' | 'transfer'>(
            kind: T,
            criteriaSet: Array<Thor.Criteria<T>>) {
            return Filter.create(wire, kind, criteriaSet)
        },
        subscribe<T extends 'event' | 'transfer' | 'block'>(
            subject: T,
            criteria: Thor.Criteria<T>
        ) {
            return Subscription.create(wire, subject, criteria)
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
            ).then(r => TxVisitor.create(wire, r.id))
        }
    }
}
