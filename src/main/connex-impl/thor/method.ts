import { abi } from 'thor-devkit'
import { BadParameter, ensure } from '../ensure'
import * as V from '@/common/validator'

export function createMethod(
    wire: Thor.Wire,
    addr: string,
    jsonABI: object
): Connex.Thor.Method {
    const coder = new abi.Function(jsonABI as any)
    try {
        // tslint:disable-next-line:no-unused-expression
        coder.signature
    } catch  {
        throw new BadParameter(`'abi' is invalid`)
    }

    const opts: {
        value: string | number
        caller?: string
        gas?: number
        gasPrice?: string
    } = {
        value: 0
    }

    return {
        value(val) {
            if (typeof val === 'number') {
                ensure(Number.isSafeInteger(val) && val >= 0,
                    `'value' expected non-neg safe integer`)
            } else {
                ensure(V.isHexString(val) || V.isDecString(val),
                    `'value' expected integer in hex/dec string`)
            }
            opts.value = val
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
        asClause: (...args) => {
            const data = coder.encode(...args)
            return {
                to: addr,
                value: opts.value.toString(),
                data
            }
        },
        call: (...args) => {
            const revision = wire.head.id
            const data = coder.encode(...args)
            const input = {
                ...opts, data, value: opts.value.toString()
            }

            return wire.post<Connex.Thor.VMOutput>(
                `accounts/${encodeURIComponent(addr)}`,
                input,
                { revision })
                .then(output => {
                    if (output.reverted) {
                        return { ...output, decoded: {} }
                    } else {
                        const decoded = coder.decode(output.data)
                        return { ...output, decoded }
                    }
                })
        }
    }
}
