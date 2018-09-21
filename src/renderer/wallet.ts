import { cry } from 'thor-devkit'
import * as LocalForage from 'localforage'
import 'localforage-observable'
import Deferred from '@/base/deferred'
// tslint:disable-next-line:no-var-requires variable-name
const ZenObservable = require('zen-observable')

LocalForage.newObservable.factory = (subscribeFn) => {
    return new ZenObservable(subscribeFn)
}

class Wallet {
    public static async encrypt(
        name: string,
        privateKey: Buffer,
        password: string
    ) {
        const keystore = await cry.Keystore.encrypt(
            privateKey,
            password)

        return new Wallet({
            address: keystore.address,
            name,
            keystore
        })
    }

    constructor(readonly entity: Wallet.Entity) { }

    public decrypt(password: string) {
        return cry.Keystore.decrypt(this.entity.keystore, password)
    }

    public async sign(msgHash: Buffer, password: string) {
        const privateKey = await this.decrypt(password)
        return cry.secp256k1.sign(msgHash, privateKey)
    }
}

namespace Wallet {
    export interface Entity {
        readonly address: string
        readonly name: string
        readonly keystore: cry.Keystore
    }

    export interface ChangeEvent {
        address: string
        method: string
    }

    export class Persist {
        private readonly storage = LocalForage.createInstance({
            driver: LocalForage.INDEXEDDB,
            name: 'sync',
            storeName: 'wallet_store'
        })
        private observable?: Observable<LocalForageObservableChange>

        public async list() {
            const entities: Entity[] = []
            await this.storage.iterate<Entity, void>(v => {
                entities.push(v)
            })
            return entities
        }

        public get(address: string) {
            return this.storage.getItem<Entity | null>(address)
        }

        public async save(
            entity: Entity,
            force?: boolean) {
            if (!force) {
                if (await this.get(entity.address)) {
                    throw new Error('wallet exists')
                }
            }
            await this.storage.setItem(entity.address, entity)
        }

        public async remove(address: string) {
            await this.storage.removeItem(address)
        }

        public subscribe(onChange: (event: ChangeEvent) => void): { unsubscribe(): void } {
            const deferredUnsubscribe = new Deferred<void>();
            (async () => {
                try {
                    await this.storage.ready()
                    if (!this.observable) {
                        this.observable = this.storage.newObservable()
                    }
                    const subscription = this.observable.subscribe({
                        next(v) {
                            onChange({
                                address: v.key,
                                method: v.methodName
                            })
                        }
                    })
                    await deferredUnsubscribe
                    subscription.unsubscribe()
                } catch (err) {
                    // tslint:disable-next-line:no-console
                    console.log(err)
                }
            })()

            return {
                unsubscribe() { deferredUnsubscribe.resolve() }
            }
        }
    }
}

export default Wallet
