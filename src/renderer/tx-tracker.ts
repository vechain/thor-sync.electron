import { remote } from 'electron'
// tslint:disable:no-console

class TxTracker {
    constructor() {
        if (isUniqueWindow()) {
            DB.txRecords.where({ status: 'sending' }).modify({ status: 'inserted' })
                .catch(err => console.error(err))
        }

        this.trackLoop()
        BUS.$on('send-tx', (txId: string) => {
            this.send(txId)
        })
    }

    private async send(txId: string) {
        const raw = await DB.transaction('rw', DB.txRecords, async () => {
            const rec = await DB.txRecords.get(txId)
            if (!rec) {
                throw new Error('tx record not found')
            }
            if (rec.status === 'confirmed') {
                throw new Error('tx confirmed')
            }
            await DB.txRecords.update(txId, { status: 'sending', errorString: '' })
            return rec.raw
        })

        try {
            await connex.commitTx(raw)
            await DB.txRecords.update(txId, { status: 'sent', errorString: '' })
        } catch (err) {
            await DB.txRecords.update(txId, { status: 'inserted', errorString: err.message })
        }
    }

    private async trackLoop() {
        const skipSet = new Set<string>()
        const ticker = connex.thor.ticker()
        for (; ;) {
            try {
                const unconfirmed = (await DB.txRecords
                    .where('status')
                    .notEqual('confirmed')
                    .toArray()).filter(tx => !skipSet.has(tx.id))

                const chainStatus = connex.thor.status

                const receipts = await Promise.all(unconfirmed.map(tx => {
                    return connex.thor
                        .transaction(tx.id, {head: chainStatus.head.id})
                        .getReceipt()
                        .then(r => {
                            if (r) {
                                return r
                            }
                            if (Date.now() - tx.insertTime > 3 * 3600 * 1000) {
                                skipSet.add(tx.id)
                            }
                            return null
                        })
                        .catch(() => undefined)
                }))
                await DB.transaction('rw', DB.txRecords, async () => {
                    for (let i = 0; i < receipts.length; i++) {
                        const receipt = receipts[i]
                        if (receipt === undefined) {
                            continue
                        }
                        await DB.txRecords.update(unconfirmed[i].id, { receipt: receipts[i] })
                        if (receipt && chainStatus.head.number - receipt.meta.blockNumber >= 12) {
                            await DB.txRecords.update(unconfirmed[i].id, { status: 'confirmed' })
                        }
                    }
                })
                await ticker.next()
            } catch (err) {
                console.error(err)
                await sleep(20000)
            }
        }
    }
}

function isUniqueWindow() {
    return remote.BrowserWindow.getAllWindows()
        .filter(w => {
            try {
                const c = w.webContents.getWebPreferences().xargs!.config!
                return c.genesis.id === ENV.xargs!.config!.genesis.id
            } catch {
                return false
            }
        }).length < 2
}

function sleep(ms: number) {
    return new Promise<void>(resolve => setTimeout(resolve, ms))
}

export default TxTracker
