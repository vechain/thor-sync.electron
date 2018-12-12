import BigNumber from 'bignumber.js'
import { Transaction } from 'thor-devkit'
import { randomBytes } from 'crypto'
import { cry } from 'thor-devkit'

namespace contracts {
    export namespace params {
        const address = '0x0000000000000000000000000000506172616d73'
        const abiGet = {
            constant: true,
            inputs: [{ name: '_key', type: 'bytes32' }],
            name: 'get',
            outputs: [{ name: '', type: 'uint256' }],
            payable: false,
            stateMutability: 'view',
            type: 'function'
        }

        export async function get(key: string) {
            const result = await connex.thor
                .account(address)
                .method(abiGet)
                .call(key)
            return result.data
        }
    }
}

let cachedBaseGasPrice: BigNumber | undefined
async function getBaseGasPrice() {
    if (cachedBaseGasPrice) {
        return cachedBaseGasPrice
    }
    const data = await contracts.params.get(
        '0x000000000000000000000000000000000000626173652d6761732d7072696365')

    cachedBaseGasPrice = new BigNumber(data)
    return cachedBaseGasPrice
}

export type EstimateGasResult = {
    gas: number,
    reverted: boolean
    vmError: string
    baseGasPrice: BigNumber
}

export async function estimateGas(
    clauses: Connex.Thor.Clause[],
    suggestedGas: number,
    caller: string): Promise<EstimateGasResult> {

    const outputs = await connex.thor.explain()
        .caller(caller)
        .gas(2000 * 10000)
        .execute(clauses)

    if (!suggestedGas) {
        const execGas = outputs.reduce((sum, out) => sum + out.gasUsed, 0)
        suggestedGas = Math.round(execGas * 1.2 + Transaction.intrinsicGas(clauses))
    }
    const bgp = await getBaseGasPrice()
    const lastOutput = outputs.slice().pop()
    return {
        gas: suggestedGas,
        reverted: lastOutput ? lastOutput.reverted : false,
        vmError: lastOutput ? lastOutput.vmError : '',
        baseGasPrice: bgp,
    }
}

export function buildTx(
    clauses: Connex.Thor.Clause[],
    gasPriceCoef: number,
    gas: number) {

    const genesis = connex.thor.genesis
    const bestId = connex.thor.status.head.id
    const tx = new Transaction({
        chainTag: Number.parseInt(genesis.id.slice(genesis.id.length - 2), 16),
        blockRef: bestId.slice(0, 18),
        expiration: 720,
        clauses,
        gasPriceCoef,
        gas,
        dependsOn: null,
        nonce: '0x' + randomBytes(8).toString('hex')
    })
    return {
        sign: async (keystore: cry.Keystore, password: string) => {
            tx.signature = undefined
            const privateKey = await cry.Keystore.decrypt(keystore, password)
            tx.signature = cry.secp256k1.sign(cry.blake2b256(tx.encode()), privateKey)
            return {
                txId: tx.id!,
                rawTx: '0x' + tx.encode().toString('hex')
            }
        }
    }
}


import { sleep } from '@/common/sleep'

export async function trackTxLoop() {
    const ticker = connex.thor.ticker()
    const skips = new Set<string>()
    for (; ;) {
        try {
            const records = await BDB.txRecords
                .where({ confirmed: 0 })
                .and(r => !skips.has(r.id))
                .toArray()

            const head = connex.thor.status.head

            const receipts = await Promise.all(records.map(async rec => {
                try {
                    const receipt = await connex.thor
                        .transaction(rec.id)
                        .head(head.id)
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

            await BDB.transaction('rw', BDB.txRecords, async () => {
                for (let i = 0; i < receipts.length; i++) {
                    const receipt = receipts[i]
                    if (receipt === undefined) {
                        continue
                    }
                    const confirmed = (receipt && head.number - receipt.meta!.blockNumber >= 12) ? 1 : 0
                    await BDB.txRecords.update(records[i].id, {
                        confirmed,
                        receipt
                    })
                }
            })
            await Promise.race([ticker.next(), sleep(200000)])
        } catch (err) {
            // tslint:disable-next-line:no-console
            console.warn(err)
            await sleep(20000)
        }
    }
}
