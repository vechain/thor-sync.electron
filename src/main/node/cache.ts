import * as LRU from 'lru-cache'
import { Bloom } from 'thor-devkit'
import BigNumber from 'bignumber.js'

type AccountSnapshot = {
    account: Connex.Thor.Account
    timestamp: number
}

type Slot = {
    id: string
    number: number
    parentID: string
    timestamp: number
    bloom?: Bloom
    block?: Connex.Thor.Block
    accounts: Map<string, AccountSnapshot>
    txs: Map<string, Connex.Thor.Transaction>
    receipts: Map<string, Connex.Thor.Receipt>
    filters: Map<string, { result: any, testKeys: string[][] }>
}
const WINDOW_LEN = 12

export class Cache {
    private readonly blockCache = new LRU<string | number, Connex.Thor.Block>(256)
    private readonly txCache = new LRU<string, Connex.Thor.Transaction>(512)
    private readonly receiptCache = new LRU<string, Connex.Thor.Receipt>(512)
    private readonly slots = new Map<string, Slot>()
    private readonly window: Slot[] = []

    public advance(head: Connex.Thor.Status['head'], bloom?: Bloom, block?: Connex.Thor.Block) {
        while (this.window.length > 0) {
            const last = this.window[this.window.length - 1]
            if (head.id === last.id) {
                return
            }
            if (head.parentID === last.id) {
                break
            }
            this.slots.delete(this.window.pop()!.id)
        }

        const newSlot = {
            ...head,
            bloom,
            accounts: new Map(),
            txs: new Map(),
            receipts: new Map(),
            filters: new Map(),
            block
        }
        this.window.push(newSlot)
        this.slots.set(newSlot.id, newSlot)

        while (this.window.length > WINDOW_LEN) {
            const slot = this.window.shift()!
            this.slots.delete(slot.id)

            slot.txs.forEach((v, k) => this.txCache.set(k, v))
            slot.receipts.forEach((v, k) => this.receiptCache.set(k, v))
            if (slot.block) {
                this.blockCache.set(slot.block.id, slot.block)
                this.blockCache.set(slot.block.number, slot.block)
            }
        }
    }

    public async getBlock(rev: string | number, fetch: () => Promise<Connex.Thor.Block | null>) {
        if (typeof rev === 'string') {
            rev = rev.toLowerCase()
        }
        let block = this.blockCache.get(rev) || null
        if (block) {
            return block
        }

        const slot = typeof rev === 'string' ?
            this.slots.get(rev) : this.window.find(s => s.number === rev)
        if (slot && slot.block) {
            return slot.block
        }

        block = await fetch()
        if (block) {
            if (slot) {
                slot.block = block
            }
            if (this.window.length > 0 &&
                block.number < this.window[0].number + this.window.length - WINDOW_LEN) {
                this.blockCache.set(block.id, block)
                this.blockCache.set(block.number, block)
            }
        }
        return block
    }

    public async getAccount(
        addr: string,
        rev: string,
        fetch: () => Promise<Connex.Thor.Account>
    ) {
        addr = addr.toLowerCase()
        rev = rev.toLowerCase()

        const slot = this.slots.get(rev)
        if (slot) {
            let pSlot: Slot | undefined = slot
            while (pSlot) {
                const snapshot = pSlot.accounts.get(addr)
                if (snapshot) {
                    slot.accounts.set(addr, snapshot)
                    const energy = computeEnergy(snapshot.account, snapshot.timestamp, slot.timestamp)
                    return { ...snapshot.account, energy }
                }
                if (!pSlot.bloom) {
                    // always invalidate account when bloom unavailable
                    break
                } else if (testBytesHex(pSlot.bloom, addr)) {
                    // account might be dirty
                    break
                }
                pSlot = this.slots.get(pSlot.parentID)
            }
        }
        const acc = await fetch()
        if (slot) {
            slot.accounts.set(addr, { account: acc, timestamp: slot.timestamp })
        }
        return acc
    }

    public async getTx(
        txid: string,
        fetch: () => Promise<Connex.Thor.Transaction | null>) {
        txid = txid.toLowerCase()
        {
            const tx = this.txCache.get(txid) || null
            if (tx) {
                return tx
            }
        }
        for (const slot of this.window) {
            const tx = slot.txs.get(txid)
            if (tx) {
                return tx
            }
        }
        {
            const tx = await fetch()
            if (tx) {
                const slot = this.slots.get(tx.meta.blockID)
                if (slot) {
                    slot.txs.set(txid, tx)
                }
                if (this.window.length > 0 &&
                    tx.meta.blockNumber < this.window[0].number + this.window.length - WINDOW_LEN) {
                    this.txCache.set(tx.id, tx)
                }
            }
            return tx
        }
    }

    public async getReceipt(
        txid: string,
        fetch: () => Promise<Connex.Thor.Receipt | null>) {
        txid = txid.toLowerCase()
        {
            const receipt = this.receiptCache.get(txid) || null
            if (receipt) {
                return receipt
            }
        }
        for (const slot of this.window) {
            const receipt = slot.receipts.get(txid)
            if (receipt) {
                return receipt
            }
        }
        {
            const receipt = await fetch()
            if (receipt) {
                const slot = this.slots.get(receipt.meta.blockID)
                if (slot) {
                    slot.receipts.set(txid, receipt)
                }
                if (this.window.length > 0 &&
                    receipt.meta.blockNumber < this.window[0].number + this.window.length - WINDOW_LEN) {
                    this.receiptCache.set(txid, receipt)
                }
            }
            return receipt
        }
    }

    public async filter<T extends 'event' | 'transfer'>(
        key: string,
        testKeys: () => string[][],
        fetch: () => Promise<Connex.Thor.Filter.Result<T>>
    ): Promise<Connex.Thor.Filter.Result<T>> {

        FETCH:
        for (let i = this.window.length - 1; i >= 0; i--) {
            const filter = this.window[i].filters.get(key)
            if (filter) {
                for (let j = i + 1; j < this.window.length; j++) {
                    const bloom = this.window[j].bloom
                    if (bloom) {
                        if (filter.testKeys.length === 0 || filter.testKeys.some(set => {
                            return !set.some(k => !testBytesHex(bloom, k))
                        })) {
                            break FETCH
                        }
                    } else {
                        break FETCH
                    }
                }
                this.window[this.window.length - 1].filters.set(key, filter)
                return filter.result
            }
        }

        const headSlot = this.window.length > 0 ? this.window[this.window.length - 1] : undefined
        const result = await fetch()
        if (headSlot) {
            headSlot.filters.set(key, {
                result,
                testKeys: testKeys()
            })
        }
        return result
    }
}


function testBytesHex(bloom: Bloom, hex: string) {
    let buf = Buffer.from(hex.slice(2), 'hex')
    const nzIndex = buf.findIndex(v => v !== 0)
    if (nzIndex < 0) {
        buf = Buffer.alloc(0)
    } else {
        buf = buf.slice(nzIndex)
    }
    return bloom.test(buf)
}

const energyGrowthRate = new BigNumber(5000000000)
const e18 = new BigNumber('1' + '0'.repeat(18))

function computeEnergy(acc: Connex.Thor.Account, initTs: number, ts: number) {
    if (ts < initTs) {
        return acc.energy
    }

    return '0x' + new BigNumber(acc.balance)
        .times(ts - initTs)
        .times(energyGrowthRate)
        .dividedToIntegerBy(e18)
        .plus(new BigNumber(acc.energy))
        .toString(16)
}

