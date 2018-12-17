import { createEventVisitor } from './event-visitor'
import { createMethod } from './method'
import * as V from '@/common/validator'
import { ensure } from '../ensure'
import cloneDeep from 'lodash.clonedeep'

export function createAccountVisitor(
    wire: Thor.Wire,
    cache: Thor.Cache,
    addr: string
): Connex.Thor.AccountVisitor {
    return {
        get address() { return addr },
        get: () => {
            const revision = wire.head.id
            return cache.getAccount(addr, revision, () => {
                return wire.get<Connex.Thor.Account>(
                    `accounts/${encodeURIComponent(addr)}`,
                    { revision })
            }).then(acc => cloneDeep(acc))
        },
        getCode: () => {
            const revision = wire.head.id
            return wire.get<Connex.Thor.Code>(
                `accounts/${encodeURIComponent(addr)}/code`,
                { revision })
        },
        getStorage: key => {
            ensure(V.isBytes32(key), `'key' expected bytes32 in hex string`)
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
