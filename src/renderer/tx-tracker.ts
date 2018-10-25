import { sleep } from '@/common/sleep'

export async function trackTxLoop() {
    const ticker = connex.thor.ticker()
    const skips = new Set<string>()
    for (; ;) {
        try {
            const records = await DB.txRecords
                .where({ confirmed: 0 })
                .and(r => !skips.has(r.id))
                .toArray()

            const chainStatus = connex.thor.status

            const receipts = await Promise.all(records.map(async rec => {
                try {
                    const receipt = await connex.thor
                        .transaction(rec.id, { head: chainStatus.head.id })
                        .getReceipt()

                    if (!receipt) {
                        if (Date.now() - rec.insertTime > 2 * 3600 * 1000) {
                            skips.add(rec.id)
                        }
                    }
                    return receipt
                } catch (err) {
                    // tslint:disable-next-line:no-console
                    console.warn(err)
                    return undefined
                }
            }))

            await DB.transaction('rw', DB.txRecords, async () => {
                for (let i = 0; i < receipts.length; i++) {
                    const receipt = receipts[i]
                    if (receipt === undefined) {
                        continue
                    }
                    const confirmed = (receipt && chainStatus.head.number - receipt.meta.blockNumber >= 12) ? 1 : 0
                    await DB.txRecords.update(records[i].id, {
                        confirmed,
                        receipt
                    })
                }
            })
            await ticker.next()
        } catch (err) {
            // tslint:disable-next-line:no-console
            console.warn(err)
            await sleep(20000)
        }
    }
}
