import Thor = Connex.Thor
import { abi } from 'thor-devkit'

export function createMethodVisitor(
    wire: Thor.Site.Wire,
    addr: string,
    abiDef: object,
    revision?: string | number
): Thor.MethodVisitor {
    const coder = new abi.Function(abiDef as any)
    return {
        asClause(
            args: any[],
            value?: string | number): Thor.Clause {
            const data = coder.encode(...args)
            return {
                to: addr,
                value: value ? value.toString() : '0x0',
                data
            }
        },
        call(
            args: any[],
            options?: Thor.VMOptions
        ) {
            options = options || {}
            const data = coder.encode(...args)
            const input = {
                ...options, data
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
