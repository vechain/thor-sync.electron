import { Transaction, cry } from 'thor-devkit'
import { randomBytes } from 'crypto'

export class TxSigning {
    constructor(
        readonly clauses: Connex.Thor.Clause[],
        readonly origin: string
    ) {
        // for validation
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

    public async estimateGas() {
        const execGas = await this.computeExecGas()

        return {
            gas: Transaction.intrinsicGas(this.clauses) +
                Math.ceil(execGas.used * 20 / 100), // up float 20%
            reverted: execGas.reverted
        }
    }

    public async sign(password: string, options: TxSigning.Options) {
        const genesis = thor.genesisBlock
        const best = await thor.block('best').get()

        const tx = new Transaction({
            chainTag: Number.parseInt(genesis.id.slice(genesis.id.length - 2), 16),
            blockRef: best!.id.slice(0, 8),
            expiration: options.expiration,
            clauses: this.clauses,
            gasPriceCoef: options.gasPriceCoef,
            gas: options.gas,
            dependsOn: null,
            nonce: '0x' + randomBytes(8).toString('hex')
        })

        const entity = await walletStore.get(this.origin)
        if (!entity) {
            throw new Error('wallet not found')
        }
        const privateKey = await cry.Keystore.decrypt(entity.keystore, password)
        tx.signature = cry.secp256k1.sign(cry.blake2b256(tx.encode()), privateKey)
        return '0x' + tx.encode().toString('hex')
    }

    private async computeExecGas() {
        let gasUsed = 0
        for (const clause of this.clauses) {
            const input = {
                value: clause.value,
                data: clause.data,
                gas: 50000000,
                caller: this.origin
            }
            let output
            if (clause.to) {
                output = await thor
                    .account(clause.to)
                    .call(input)
            } else {
                output = await thor
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
