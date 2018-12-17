import { createEventVisitor } from './event-visitor'
import { createMethod } from './method'

export function createAccountVisitor(
    wire: Thor.Wire,
    cache: Thor.Cache,
    addr: string
): Connex.Thor.AccountVisitor {
    return {
        get address() { return addr },
        get: async () => {
            const revision = wire.head.id
            return cache.getAccount(addr, revision, () => {
                return wire.get<Connex.Thor.Account>(
                    `accounts/${encodeURIComponent(addr)}`,
                    { revision })
            })
        },
        getCode: () => {
            const revision = wire.head.id
            return wire.get<Connex.Thor.Code>(
                `accounts/${encodeURIComponent(addr)}/code`,
                { revision })
        },
        getStorage: key => {
            const revision = wire.head.id
            return wire.get<Connex.Thor.Storage>(
                `accounts/${encodeURIComponent(addr)}/storage/${encodeURIComponent(key)}`,
                { revision })
        },
        method: jsonABI => {
            return createMethod(wire, addr, jsonABI)
        },
        event: jsonABI => {
            return createEventVisitor(wire, jsonABI, addr)
        }
    }
}
