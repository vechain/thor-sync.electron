import Thor = Connex.Thor

export function create<T extends 'event' | 'transfer'>(
    wire: Network.Wire,
    kind: T,
    criteriaSet: Array<Thor.Criteria<T>>
): Thor.Filter<T> {

    if (kind !== 'event' && kind !== 'transfer') {
        throw new Error('invalid filter kind')
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
        criteriaSet
    }
    const query = { order: 'asc' }

    return {
        get kind() { return kind },
        range(unit: 'block' | 'time', from: number, to: number) {
            filterBody.range = { unit, from, to }
            return this
        },
        order(order: 'asc' | 'desc') {
            query.order = order
            return this
        },
        offset(offset: number) {
            filterBody.options.offset = offset
            return this
        },
        next(limit: number) {
            filterBody.options.limit = limit
            return wire.post<Array<Thor.Log<T>>>(`logs/${kind}`, this, query)
        }
    }
}
