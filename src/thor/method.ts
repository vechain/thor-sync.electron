import Thor = Connex.Thor
import { abi } from 'thor-devkit'

export function createMethod(
    wire: Thor.Site.Wire,
    addr: string,
    abiDef: object,
    revision?: string | number
): Thor.Method {
    const coder = new abi.Function(abiDef as any)
    return {
        asClause(args, value): Thor.Clause {
            const data = coder.encode(...args)
            return {
                to: addr,
                value: value.toString(),
                data
            }
        },
        call(args, value, options) {
            options = options || {}
            const data = coder.encode(...args)
            const input = {
                ...options, data, value: value.toString()
            }
            return wire.post<Thor.VMOutput>(
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
