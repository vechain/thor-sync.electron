import { createEventVisitor } from './event-visitor'
import { createMethod } from './method'

export function createAccountVisitor(
    wire: Thor.Wire,
    addr: string,
    options: { revision?: string | number }
): Connex.Thor.AccountVisitor {

    const revision = options.revision
    return {
        get address() { return addr },
        get: () => {
            return wire.get<Connex.Thor.Account>(
                `accounts/${encodeURIComponent(addr)}`,
                { revision })
        },
        getCode: () => {
            return wire.get<Connex.Thor.Code>(
                `accounts/${encodeURIComponent(addr)}/code`,
                { revision })
        },
        getStorage: key => {
            return wire.get<Connex.Thor.Storage>(
                `accounts/${encodeURIComponent(addr)}/storage/${encodeURIComponent(key)}`,
                { revision })
        },
        method: jsonABI => {
            return createMethod(wire, addr, jsonABI, revision)
        },
        event: jsonABI => {
            return createEventVisitor(wire, jsonABI, addr)
        }
    }
}
