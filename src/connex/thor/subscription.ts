function createSubscription<T extends 'event' | 'transfer' | 'block'>(
    wire: Thor.Site.Wire,
    subject: T,
    criteria: Thor.Criteria<T>
): Thor.Subscription<T> {
    let query: any
    if (subject === 'block') {
        const c = criteria as Thor.Criteria<'block'>
        query = { pos: c.position }
    } else if (subject === 'event') {
        const c = criteria as Thor.Criteria<'event'>
        query = {
            pos: c.position,
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
            pos: c.position,
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
