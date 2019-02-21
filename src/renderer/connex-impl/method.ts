import { abi } from 'thor-devkit'
import { BadParameter, ensure } from './ensure'
import * as V from '@/common/validator'
import cloneDeep from 'lodash.clonedeep'

export function createMethod(
    client: Client,
    addr: string,
    jsonABI: object
): Connex.Thor.Method {
    const coder = (() => {
        try {
            return new abi.Function(jsonABI as any)
        } catch  {
            throw new BadParameter(`'abi' is invalid`)
        }
    })()

    let value: string | number = 0
    const opts: {
        caller?: string
        gas?: number
        gasPrice?: string
    } = {}

    let cacheTies: string[] | undefined

    return {
        value(val) {
            if (typeof val === 'number') {
                ensure(Number.isSafeInteger(val) && val >= 0,
                    `'value' expected non-neg safe integer`)
            } else {
                ensure(V.isHexString(val) || V.isDecString(val),
                    `'value' expected integer in hex/dec string`)
            }
            value = val
            return this
        },
        caller(caller) {
            ensure(V.isAddress(caller), `'caller' expected address type`)
            opts.caller = caller
            return this
        },
        gas(gas) {
            ensure(gas >= 0 && Number.isSafeInteger(gas), `'gas' expected non-neg safe integer`)
            opts.gas = gas
            return this
        },
        gasPrice(gp) {
            ensure(V.isDecString(gp) || V.isHexString(gp), `'gasPrice' expected integer in hex/dec string`)
            opts.gasPrice = gp
            return this
        },
        cache(ties: string[]) {
            ensure(Array.isArray(ties), `'ties' expected array`)
            ties.forEach((t, i) => {
                ensure(V.isAddress(t), `'ties.#${i}' expected address type`)
            })
            cacheTies = ties
            return this
        },
        asClause: (...args) => {
            try {
                const data = coder.encode(...args)
                return {
                    to: addr,
                    value: value.toString(),
                    data
                }
            } catch {
                throw new BadParameter(`'args' can not be encoded`)
            }
        },
        call(...args) {
            return client.call(
                this.asClause(...args),
                { ...opts },
                client.head.id,
                cacheTies)
                .then(output => {
                    output = cloneDeep(output)
                    if (output.reverted) {
                        return output
                    } else {
                        const decoded = coder.decode(output.data)
                        return { ...output, decoded }
                    }
                })
        }
    }
}
