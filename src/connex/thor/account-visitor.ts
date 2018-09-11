import Thor = Connex.Thor
import * as MethodVisitor from './method-visitor'
import * as EventVisitor from './event-visitor'

export function create(
    wire: Network.Wire,
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
            return MethodVisitor.create(wire, addr, abiDef, revision)
        },
        event(abiDef: object) {
            return EventVisitor.create(wire, abiDef, addr)
        }
    }
}
