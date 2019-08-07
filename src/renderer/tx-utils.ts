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
                .cache([address])
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
    revertReason: string
    vmError: string
    baseGasPrice: BigNumber
}

export async function estimateGas(
    clauses: Connex.Thor.Transaction['clauses'],
    suggestedGas: number,
    caller: string): Promise<EstimateGasResult> {

    const outputs = await connex.thor.explain()
        .caller(caller)
        .gas(2000 * 10000)
        .execute(clauses)

    if (!suggestedGas) {
        const execGas = outputs.reduce((sum, out) => sum + out.gasUsed, 0)
        const intrinsicGas = Transaction.intrinsicGas(clauses)
        suggestedGas = intrinsicGas + (execGas ? (execGas + 15000) : 0)
    }
    const bgp = await getBaseGasPrice()
    const lastOutput = outputs.slice().pop()
    return {
        gas: suggestedGas,
        reverted: lastOutput ? lastOutput.reverted : false,
        revertReason: (lastOutput && lastOutput.decoded) ? (lastOutput.decoded.revertReason || '') : '',
        vmError: lastOutput ? lastOutput.vmError : '',
        baseGasPrice: bgp,
    }
}

export function buildTx(
    clauses: Connex.Thor.Transaction['clauses'],
    gasPriceCoef: number,
    gas: number,
    dependsOn: string | null) {

    const genesis = connex.thor.genesis
    const bestId = connex.thor.status.head.id
    const tx = new Transaction({
        chainTag: Number.parseInt(genesis.id.slice(genesis.id.length - 2), 16),
        blockRef: bestId.slice(0, 18),
        expiration: 18, // about 3 mins
        clauses,
        gasPriceCoef,
        gas,
        dependsOn,
        nonce: '0x' + randomBytes(8).toString('hex')
    })
    return {
        sign: (privateKey: Buffer) => {
            tx.signature = undefined
            tx.signature = cry.secp256k1.sign(cry.blake2b256(tx.encode()), privateKey)
            return {
                txid: tx.id!,
                rawTx: '0x' + tx.encode().toString('hex')
            }
        }
    }
}
