import Thor = Connex.Thor

export function createFilter<T extends 'event' | 'transfer'>(
    wire: Thor.Site.Wire,
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
        range(range: Thor.Range) {
            filterBody.range = { ...range }
            return this
        },
        order(order: 'asc' | 'desc') {
            query.order = order
            return this
        },
        next(offset: number, limit: number) {
            filterBody.options.offset = offset
            filterBody.options.limit = limit
            return wire.post<Array<Thor.Log<T>>>(`logs/${kind}`, this, query)
        }
    }
}
