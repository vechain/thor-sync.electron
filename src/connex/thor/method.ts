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
                value: value ? value.toString() : '0x0',
                data
            }
        },
        call(args, value, options) {
            options = options || {}
            value = value ? value.toString() : '0x0'
            const data = coder.encode(...args)
            const input = {
                ...options, data, value
            }
            return wire.post<Thor.VMOutput>(
                `accounts/${encodeURIComponent(addr)}`,
                input,
                { revision })
                .then(output => {
                    const decoded = coder.decode(output.data)
                    return { ...output, decoded }
                })
        }
    }
}
