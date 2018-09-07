import Thor = Connex.Thor
import Endpoint from './endpoint'
import { abi } from 'thor-devkit'

export function create(
    ep: Endpoint,
    addr: string,
    abiDef: object,
    revision?: string | number
): Thor.MethodVisitor {
    const fn = new abi.Function(abiDef as any)
    return {
        asClause(
            args: any[],
            value?: string | number): Thor.Clause {
            const data = fn.encode(...args)
            return {
                to: addr,
                value: value ? value.toString() : '0x0',
                data
            }
        },
        call(
            args: any[],
            value?: string | number,
            caller?: string,
            gas?: number,
            gasPrice?: string
        ) {
            const data = fn.encode(...args)
            const input: Thor.VMInput = {
                value: value ? value.toString() : '0x0',
                data,
                caller,
                gas,
                gasPrice,
            }
            return ep.post<Thor.VMOutput>(
                `accounts/${encodeURIComponent(addr)}`,
                input,
                { revision }).then(output => {
                    const decoded = fn.decode(output.data)
                    return { ...output, decoded }
                })
        }
    }
}
