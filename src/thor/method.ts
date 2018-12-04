import { abi } from 'thor-devkit'

export function createMethod(
    wire: Thor.Wire,
    addr: string,
    jsonABI: object,
    revision?: string | number
): Connex.Thor.Method {
    const coder = new abi.Function(jsonABI as any)

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
            opts.value = val
            return this
        },
        caller(caller) {
            opts.caller = caller
            return this
        },
        gas(gas) {
            opts.gas = gas
            return this
        },
        gasPrice(gp) {
            opts.gasPrice = gp
            return this
        },
        asClause: (args) => {
            const data = coder.encode(...args)
            return {
                to: addr,
                value: opts.value.toString(),
                data
            }
        },
        call: async (args) => {
            const data = coder.encode(...args)
            const input = {
                ...opts, data, value: opts.value.toString()
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
