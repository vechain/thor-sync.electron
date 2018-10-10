import { Transaction, cry } from 'thor-devkit'
import { randomBytes } from 'crypto'
import Wallet from './wallet'

export class TxSigning {
    public static validate(clauses: Connex.Thor.Clause[]) {
        new Transaction({
            chainTag: 0,
            blockRef: '0x0000000000000000',
            expiration: 0,
            clauses,
            gasPriceCoef: 0,
            gas: 0,
            dependsOn: null,
            nonce: 0
        }).encode()
    }

    constructor(
        readonly clauses: Connex.Thor.Clause[],
    ) { }

    public async estimateGas(origin: string) {
        const execGas = await this.computeExecGas(origin)

        return {
            gas: Transaction.intrinsicGas(this.clauses) +
                Math.ceil(execGas.used * 20 / 100), // up float 20%
            reverted: execGas.reverted
        }
    }

    public async sign(wallet: Wallet, password: string, options: TxSigning.Options) {
        const genesis = connex.thor.genesis
        const bestId = connex.thor.status.head.id

        const tx = new Transaction({
            chainTag: Number.parseInt(genesis.id.slice(genesis.id.length - 2), 16),
            blockRef: bestId.slice(0, 18),
            expiration: options.expiration,
            clauses: this.clauses,
            gasPriceCoef: options.gasPriceCoef,
            gas: options.gas,
            dependsOn: null,
            nonce: '0x' + randomBytes(8).toString('hex')
        })

        tx.signature = await wallet.sign(cry.blake2b256(tx.encode()), password)
        return '0x' + tx.encode().toString('hex')
    }

    private async computeExecGas(origin: string) {
        let gasUsed = 0
        for (const clause of this.clauses) {
            const input = {
                value: clause.value,
                data: clause.data,
                gas: 50000000,
                caller: origin
            }
            let output
            if (clause.to) {
                output = await connex.thor
                    .account(clause.to)
                    .call(input)
            } else {
                output = await connex.thor
                    .call(input)
            }
            gasUsed += output.gasUsed
            if (output.reverted) {
                return {
                    used: gasUsed,
                    reverted: true
                }
            }
        }
        return {
            used: gasUsed,
            reverted: false
        }
    }
}

export namespace TxSigning {
    export type Options = {
        expiration: number
        gasPriceCoef: number
        gas: number
    }
}
