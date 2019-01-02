import { abi } from 'thor-devkit'
import { createFilter } from './filter'
import { BadParameter } from './ensure'

export function createEventVisitor(
    client: Client,
    jsonABI: object,
    addr: string
): Connex.Thor.EventVisitor {

    const coder = (() => {
        try {
            return new abi.Event(jsonABI as any)
        } catch {
            throw new BadParameter(`'abi' is invalid`)
        }
    })()

    return {
        asCriteria: indexed => {
            try {
                const topics = coder.encode(indexed)
                return {
                    address: addr,
                    topic0: topics[0] || undefined,
                    topic1: topics[1] || undefined,
                    topic2: topics[2] || undefined,
                    topic3: topics[3] || undefined,
                    topic4: topics[4] || undefined
                }
            } catch {
                throw new BadParameter(`'indexed' can not be encoded`)
            }
        },
        filter(indexed) {
            let criteriaSet: Connex.Thor.Event.Criteria[]
            if (indexed.length === 0) {
                criteriaSet = [this.asCriteria({})]
            } else {
                criteriaSet = indexed.map(i => this.asCriteria(i))
            }
            const filter = createFilter(client, 'event').criteria(criteriaSet)
            return {
                criteria(set) {
                    filter.criteria(set)
                    return this
                },
                range(range: Connex.Thor.Filter.Range) {
                    filter.range(range)
                    return this
                },
                order(order) {
                    filter.order(order)
                    return this
                },
                apply(offset: number, limit: number) {
                    return filter.apply(offset, limit)
                        .then(events => events.map(event => {
                            const decoded = coder.decode(event.data, event.topics)
                            return { ...event, decoded }
                        }))
                }
            }
        }
    }
}
