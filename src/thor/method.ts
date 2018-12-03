import { abi } from 'thor-devkit'

export function createMethod(
    wire: Thor.Wire,
    addr: string,
    jsonABI: object,
    revision?: string | number
): Connex.Thor.Method {
    const coder = new abi.Function(jsonABI as any)
    return {
        asClause: (args, value) => {
            const data = coder.encode(...args)
            return {
                to: addr,
                value: value.toString(),
                data
            }
        },
        call: async (args, value, options) => {
            options = options || {}
            const data = coder.encode(...args)
            const input = {
                ...options, data, value: value.toString()
            }

            const output = await wire.post<Connex.Thor.VMOutput>(
                `accounts/${encodeURIComponent(addr)}`,
                input,
                { revision })

            if (output.reverted) {
                return { ...output, decoded: {} }
            } else {
                const decoded = coder.decode(output.data)
                return { ...output, decoded }
            }
        }
    }
}
