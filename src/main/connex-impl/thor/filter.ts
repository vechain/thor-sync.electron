import { BadParameter, ensure } from '../ensure'
import * as V from '@/common/validator'
import { cry } from 'thor-devkit'
import cloneDeep from 'lodash.clonedeep'

const MAX_LIMIT = 256

export function createFilter<T extends 'event' | 'transfer'>(
    wire: Thor.Wire,
    cache: Thor.Cache,
    kind: T
): Connex.Thor.Filter<T> {

    if (kind !== 'event' && kind !== 'transfer') {
        throw new BadParameter(`'kind' unsupported filter kind`)
    }

    const filterBody = {
        range: {
            unit: 'block',
            from: 0,
            to: 2 ** 32 - 1
        },
        options: {
            offset: 0,
            limit: 10
        },
        criteriaSet: [] as Array<Connex.Thor.Event.Criteria | Connex.Thor.Transfer.Criteria>,
        order: 'asc'
    }

    return {
        criteria(set) {
            ensure(Array.isArray(set), `'set' expected array`)
            if (kind === 'event') {
                filterBody.criteriaSet = (set as Connex.Thor.Event.Criteria[])
                    .map((c, i) => {
                        ensure(!c.address || V.isAddress(c.address), `'criteria#${i}.address' expected address`)
                        const topics: Array<keyof typeof c> = ['topic0', 'topic1', 'topic2', 'topic3', 'topic4']
                        topics.forEach(t => {
                            ensure(!c[t] || V.isBytes32(c[t]!), `'criteria#${i}.${t}' expected bytes32`)
                        })

                        return {
                            address: c.address || undefined,
                            topic0: c.topic0 || undefined,
                            topic1: c.topic1 || undefined,
                            topic2: c.topic2 || undefined,
                            topic3: c.topic3 || undefined,
                            topic4: c.topic4 || undefined
                        }
                    })
            } else {
                filterBody.criteriaSet = (set as Connex.Thor.Transfer.Criteria[])
                    .map((c, i) => {
                        ensure(!c.txOrigin || V.isAddress(c.txOrigin), `'criteria#${i}.txOrigin' expected address`)
                        ensure(!c.sender || V.isAddress(c.sender), `'criteria#${i}.sender' expected address`)
                        ensure(!c.recipient || V.isAddress(c.recipient), `'criteria#${i}.recipient' expected address`)
                        return {
                            txOrigin: c.txOrigin || undefined,
                            sender: c.sender || undefined,
                            recipient: c.recipient || undefined
                        }
                    })

            }
            return this
        },
        range(range) {
            ensure(range instanceof Object, `'range' expected object`)
            ensure(range.unit === 'block' || range.unit === 'time', `'range.unit' expected 'block' or 'time'`)
            ensure(range.to >= 0 && Number.isSafeInteger(range.to), `'range.to' expected non-neg safe integer`)
            ensure(range.from >= 0 && Number.isSafeInteger(range.from), `'range.from' expected non-neg safe integer`)

            filterBody.range = { ...range }
            return this
        },
        order(order) {
            ensure(order === 'asc' || order === 'desc', `'order' expected 'asc' or 'desc'`)
            filterBody.order = order
            return this
        },
        apply(offset, limit) {
            ensure(offset >= 0 && Number.isSafeInteger(offset), `'offset' expected non-neg safe integer`)
            ensure(limit >= 0 && limit <= MAX_LIMIT && Number.isInteger(limit),
                `'limit' expected integer in [0, ${MAX_LIMIT}]`)

            filterBody.options.offset = offset
            filterBody.options.limit = limit

            const key = cry.blake2b256(kind, JSON.stringify(filterBody)).toString('hex')
            const bloomKeys = () => {
                const ks: string[] = []
                if (kind === 'event') {
                    (filterBody.criteriaSet as Connex.Thor.Event.Criteria[])
                        .forEach(c => {
                            if (c.address) { ks.push(c.address) }
                            if (c.topic0) { ks.push(c.topic0) }
                            if (c.topic1) { ks.push(c.topic1) }
                            if (c.topic2) { ks.push(c.topic2) }
                            if (c.topic3) { ks.push(c.topic3) }
                            if (c.topic4) { ks.push(c.topic4) }
                        })
                } else {
                    (filterBody.criteriaSet as Connex.Thor.Transfer.Criteria[])
                        .forEach(c => {
                            if (c.txOrigin) { ks.push(c.txOrigin) }
                            if (c.sender) { ks.push(c.sender) }
                            if (c.recipient) { ks.push(c.recipient) }
                        })
                }
                return ks
            }
            return cache.filter<typeof kind>(
                key,
                bloomKeys,
                () => wire.post<Connex.Thor.Filter.Result<T>>(`logs/${kind}`, filterBody))
                .then(cloneDeep)
        }
    }
}
