import { createEventVisitor } from './event-visitor'
import { createMethod } from './method'
import * as V from '@/common/validator'
import { ensure } from './ensure'
import cloneDeep from 'lodash.clonedeep'

export function createAccountVisitor(
    client: Client,
    addr: string
): Connex.Thor.AccountVisitor {
    return {
        get address() { return addr },
        get: () => {

            return client.getAccount(addr, client.head.id)
                .then(cloneDeep)
        },
        getCode: () => {
            return client.getCode(addr, client.head.id)
                .then(cloneDeep)
        },
        getStorage: key => {
            ensure(V.isBytes32(key), `'key' expected bytes32 in hex string`)
            return client.getStorage(addr, key, client.head.id)
                .then(cloneDeep)
        },
        method: jsonABI => {
            return createMethod(client, addr, jsonABI)
        },
        event: jsonABI => {
            return createEventVisitor(client, jsonABI, addr)
        }
    }
}
