import Thor = Connex.Thor
import { createEventVisitor } from './event-visitor'
import { createMethod } from './method'

export function createAccountVisitor(
    wire: Thor.Site.Wire,
    addr: string,
    revision?: string | number): Thor.AccountVisitor {

    return {
        get address() { return addr },
        get revision() { return revision },
        get() {
            return wire.get<Thor.Account>(
                `accounts/${encodeURIComponent(addr)}`,
                { revision })
        },
        getCode() {
            return wire.get<Thor.Account.Code>(
                `accounts/${encodeURIComponent(addr)}/code`,
                { revision })
        },
        getStorage(key: string) {
            return wire.get<Thor.Account.Storage>(
                `accounts/${encodeURIComponent(addr)}/storage/${encodeURIComponent(key)}`,
                { revision })
        },
        call(input: Thor.VMInput) {
            return wire.post<Thor.VMOutput>(
                `accounts/${encodeURIComponent(addr)}`,
                input,
                { revision })
        },
        method(abiDef: object) {
            return createMethod(wire, addr, abiDef, revision)
        },
        event(abiDef: object) {
            return createEventVisitor(wire, abiDef, addr)
        }
    }
}
