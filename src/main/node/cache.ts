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
}

export class Cache implements Thor.Cache {
    private readonly blockCache = new LRU<string | number, Connex.Thor.Block>(256)
    private readonly txCache = new LRU<string, Connex.Thor.Transaction>(512)
    private readonly receiptCache = new LRU<string, Connex.Thor.Receipt>(512)
    private readonly slots = new Map<string, Slot>()
    private readonly window: Slot[] = []

    public advance(head: Connex.Thor.Status['head'], bloom?: Bloom) {
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
            receipts: new Map()
        }
        this.window.push(newSlot)
        this.slots.set(newSlot.id, newSlot)

        while (this.window.length > 60) {
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
        }
        return block
    }

    public async getAccount(
        addr: string,
        rev: string,
        fetch: () => Promise<Connex.Thor.Account>
    ) {
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
                } else if (testAddress(pSlot.bloom, addr)) {
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
        txId: string,
        fetch: () => Promise<Connex.Thor.Transaction | null>) {
        {
            const tx = this.txCache.get(txId) || null
            if (tx) {
                return tx
            }
        }
        for (const slot of this.window) {
            const tx = slot.txs.get(txId)
            if (tx) {
                return tx
            }
        }
        {
            const tx = await fetch()
            if (tx) {
                const slot = this.slots.get(tx.meta.blockID)
                if (slot) {
                    slot.txs.set(txId, tx)
                }
            }
            return tx
        }
    }

    public async getReceipt(
        txId: string,
        fetch: () => Promise<Connex.Thor.Receipt | null>) {
        {
            const receipt = this.receiptCache.get(txId) || null
            if (receipt) {
                return receipt
            }
        }
        for (const slot of this.window) {
            const receipt = slot.receipts.get(txId)
            if (receipt) {
                return receipt
            }
        }
        {
            const receipt = await fetch()
            if (receipt) {
                const slot = this.slots.get(receipt.meta.blockID)
                if (slot) {
                    slot.receipts.set(txId, receipt)
                }
            }
            return receipt
        }
    }
}


function testAddress(bloom: Bloom, addr: string) {
    let buf = Buffer.from(addr.slice(2), 'hex')
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

