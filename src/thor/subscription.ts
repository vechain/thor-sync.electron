import Thor = Connex.Thor

export function createSubscription<T extends 'event' | 'transfer' | 'block'>(
    wire: Thor.Site.Wire,
    subject: T,
    criteria: Thor.Criteria<T>,
    options: { position?: string }
): Thor.Subscription<T> {
    const position = options.position

    let query: any
    if (subject === 'block') {
        const c = criteria as Thor.Criteria<'block'>
        query = { pos: position }
    } else if (subject === 'event') {
        const c = criteria as Thor.Criteria<'event'>
        query = {
            pos: position,
            addr: c.address,
            t0: c.topic0,
            t1: c.topic1,
            t2: c.topic2,
            t3: c.topic3,
            t4: c.topic4
        }
    } else if (subject === 'transfer') {
        const c = criteria as Thor.Criteria<'transfer'>
        query = {
            pos: position,
            txOrigin: c.txOrigin,
            sender: c.sender,
            recipient: c.recipient
        }
    } else {
        throw new Error('invalid subject')
    }

    const ws = wire.ws(`subscriptions/${subject}`, query)
    return {
        get subject() { return subject },
        async next() {
            const data = await ws.read()
            return JSON.parse(data.toString()) as Thor.Subscription.Message<T>
        },
        unsubscribe() {
            ws.close()
        }
    }
}
