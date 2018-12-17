import { BadParameter, ensure } from '../ensure'
import cloneDeep from 'lodash.clonedeep'

export function createFilter<T extends 'event' | 'transfer'>(
    wire: Thor.Wire,
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
        criteriaSet: [] as Array<Connex.Thor.Filter.Criteria<T>>,
        order: 'asc'
    }

    return {
        criteria(set) {
            ensure(Array.isArray(set), `'set' expected array`)
            // TODO deeply validate

            filterBody.criteriaSet = cloneDeep(set)
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
            ensure(limit >= 0 && Number.isSafeInteger(limit), `'limit' expected non-neg safe integer`)

            filterBody.options.offset = offset
            filterBody.options.limit = limit
            return wire.post<Connex.Thor.Filter.Result<T>>(`logs/${kind}`, filterBody)
        }
    }
}
