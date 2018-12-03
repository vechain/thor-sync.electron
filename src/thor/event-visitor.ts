import { abi } from 'thor-devkit'
import { createFilter } from './filter'

export function createEventVisitor(
    wire: Thor.Wire,
    jsonABI: object,
    addr: string): Connex.Thor.EventVisitor {

    const coder = new abi.Event(jsonABI as any)
    return {
        asCriteria: indexed => {
            const topics = coder.encode(indexed)
            return {
                address: addr,
                topic0: topics[0] || undefined,
                topic1: topics[1] || undefined,
                topic2: topics[2] || undefined,
                topic3: topics[3] || undefined,
                topic4: topics[4] || undefined
            }
        },
        filter(indexed) {
            let criteriaSet: Connex.Thor.Event.Criteria[]
            if (indexed.length === 0) {
                criteriaSet = [this.asCriteria({})]
            } else {
                criteriaSet = indexed.map(i => this.asCriteria(i))
            }
            const filter = createFilter(wire, 'event').criteria(criteriaSet)
            return {
                criteria(set) {
                    filter.criteria(set)
                    return this
                },
                range(range: Connex.Thor.Filter.Range) {
                    filter.range(range)
                    return this
                },
                desc() {
                    filter.desc()
                    return this
                },
                async apply(offset: number, limit: number) {
                    const events = await filter.apply(offset, limit)
                    return events.map(event => {
                        const decoded = coder.decode(event.data, event.topics)
                        return { ...event, decoded }
                    })
                }
            }
        }
    }
}
