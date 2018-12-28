
async function handleTx(txRow: entities.Activity<'tx'>, dispose: () => void) {
    try {
        const ticker = connex.thor.ticker()
        for (; ;) {
            const head = connex.thor.status.head
            if (head.number > 0) {
                try {
                    const receipt = await connex.thor.transaction(txRow.data.id).getReceipt()
                    const confirmed = receipt ? head.number - receipt.meta.blockNumber >= 12 : false
                    const expired = !receipt && (head.timestamp - txRow.data.timestamp > 3600 * 2)
                    await BDB.activities
                        .where({ id: txRow.id! })
                        .modify(row => {
                            row.closed = (confirmed || expired) ? 1 : 0;
                            (row.data as entities.Activity.Tx).receipt = receipt
                        })
                    if (confirmed || expired) {
                        break
                    }
                } catch (err) {
                    // tslint:disable-next-line:no-console
                    console.warn(err)
                }
            }
            await ticker.next()
        }
    } finally {
        dispose()
    }
}

const handlers = new Set<number>()

export function trackTxLoop() {
    dispatch()
    BDB.activities.subscribe(changes => {
        if (changes.some(c => c === 'creating')) {
            dispatch()
        }
    })
}

async function dispatch() {
    const unclosed = await BDB.activities
        .where({ closed: 0 })
        .toArray()

    unclosed.filter(row => row.type === 'tx')
        .forEach(row => {
            if (!handlers.has(row.id!)) {
                handlers.add(row.id!)
                handleTx(row as any, () => handlers.delete(row.id!))
            }
        })
}
