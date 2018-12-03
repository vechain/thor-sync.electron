
export function createFilter<T extends 'event' | 'transfer'>(
    wire: Thor.Wire,
    kind: T
): Connex.Thor.Filter<T> {

    if (kind !== 'event' && kind !== 'transfer') {
        throw new Error('unsupported filter kind')
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
            filterBody.criteriaSet = set
            return this
        },
        range(range) {
            filterBody.range = { ...range }
            return this
        },
        desc() {
            filterBody.order = 'desc'
            return this
        },
        apply(offset, limit) {
            filterBody.options.offset = offset
            filterBody.options.limit = limit
            return wire.post<Connex.Thor.Filter.Result<T>>(`logs/${kind}`, filterBody)
        }
    }
}
