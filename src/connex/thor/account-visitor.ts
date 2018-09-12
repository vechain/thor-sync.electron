import Thor = Connex.Thor
import { createEventVisitor } from './event-visitor'
import { createMethodVisitor } from './method-visitor'

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
        code() {
            return wire.get<{ code: string }>(
                `accounts/${encodeURIComponent(addr)}/code`,
                { revision })
                .then(r => r.code)
        },
        storage(key: string) {
            return wire.get<{ value: string }>(
                `accounts/${encodeURIComponent(addr)}/storage/${encodeURIComponent(key)}`,
                { revision })
                .then(r => r.value)
        },
        call(input: Thor.VMInput) {
            return wire.post<Thor.VMOutput>(
                `accounts/${encodeURIComponent(addr)}`,
                input,
                { revision })
        },
        method(abiDef: object) {
            return createMethodVisitor(wire, addr, abiDef, revision)
        },
        event(abiDef: object) {
            return createEventVisitor(wire, abiDef, addr)
        }
    }
}
