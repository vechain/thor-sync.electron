import Thor = Connex.Thor
import Endpoint from './endpoint'
import * as MethodVisitor from './method-visitor'
import * as EventVisitor from './event-visitor'

export function create(
    ep: Endpoint,
    addr: string,
    revision?: string | number) {

    const acc: Thor.AccountVisitor = {
        get address() { return addr },
        get revision() { return revision },
        get() {
            return ep.get<Thor.Account>(
                `accounts/${encodeURIComponent(addr)}`,
                { revision })
        },
        code() {
            return ep.get<{ code: string }>(
                `accounts/${encodeURIComponent(addr)}/code`,
                { revision })
                .then(r => r.code)
        },
        storage(key: string) {
            return ep.get<{ value: string }>(
                `accounts/${encodeURIComponent(addr)}/storage/${encodeURIComponent(key)}`,
                { revision })
                .then(r => r.value)
        },
        call(input: Thor.VMInput) {
            return ep.post<Thor.VMOutput>(
                `accounts/${encodeURIComponent(addr)}`,
                input,
                { revision })
        },
        method(abiDef: object) {
            return MethodVisitor.create(ep, addr, abiDef, revision)
        },
        event(abiDef: object) {
            return EventVisitor.create(ep, abiDef, addr)
        }
    }
    return acc
}
