import Thor = Connex.Thor
import { abi } from 'thor-devkit'
import { createFilter } from './filter'
import { createSubscription } from './subscription'

export function createEventVisitor(
    wire: Thor.Site.Wire,
    abiDef: object,
    addr: string): Thor.EventVisitor {

    const coder = new abi.Event(abiDef as any)
    return {
        asCriteria(indexed) {
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
            const criteriaSet = indexed.map(i => this.asCriteria(i))
            const filter = createFilter(wire, 'event', criteriaSet)

            const transformed: Thor.Filter<'decoded-event'> = {
                kind: 'decoded-event',
                range(range: Thor.Range) {
                    filter.range(range)
                    return transformed
                },
                order(order: 'asc' | 'desc') {
                    filter.order(order)
                    return transformed
                },
                next(offset: number, limit: number) {
                    return filter
                        .next(offset, limit)
                        .then(events => events.map(event => {
                            const decoded = coder.decode(event.data, event.topics)
                            return { ...event, decoded }
                        }))
                }
            }
            return transformed
        },
        subscribe(indexed) {
            const criteria = this.asCriteria(indexed)
            const sub = createSubscription(wire, 'event', criteria)
            return {
                subject: 'decoded-event',
                next() {
                    return sub
                        .next()
                        .then(msg => {
                            const decoded = coder.decode(msg.data, msg.topics)
                            return { ...msg, decoded }
                        })
                },
                unsubscribe() {
                    sub.unsubscribe()
                }
            }
        }
    }
}
