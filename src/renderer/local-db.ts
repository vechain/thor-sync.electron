import * as LocalForage from 'localforage'
import 'localforage-observable'
import Deferred from '@/common/deferred'
// tslint:disable-next-line:no-var-requires variable-name
const ZenObservable = require('zen-observable')

LocalForage.newObservable.factory = (subscribeFn) => {
    return new ZenObservable(subscribeFn)
}

class LocalDB<T extends object> {
    private readonly storage: LocalForage
    private observable?: Observable<LocalForageObservableChange>

    constructor(name: string, table: string) {
        this.storage = LocalForage.createInstance({
            driver: LocalForage.INDEXEDDB,
            name,
            storeName: table
        })
    }

    public get(key: string) {
        return this.storage.getItem<T | null>(key)
    }

    public async set(key: string, value: T, force?: boolean) {
        if (!force) {
            if (await this.get(key)) {
                throw new Error(`key already exist: ${key}`)
            }
        }
        await this.storage.setItem(key, value)
    }

    public remove(key: string) {
        return this.storage.removeItem(key)
    }

    public async list() {
        const result = [] as Array<[string, T]>
        await this.storage.iterate<T, void>((v, k) => {
            result.push([k, v])
        })
        return result
    }

    public subscribe(cb: (event: LocalDB.Event) => void) {
        const deferredUnsubscribe = new Deferred<void>();
        (async () => {
            try {
                await this.storage.ready()
                if (!this.observable) {
                    this.observable = this.storage.newObservable()
                }
                const subscription = this.observable.subscribe({
                    next(v) {
                        cb({
                            key: v.key,
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

namespace LocalDB {
    export type Event = {
        key: string
        method: string
    }
}

export default LocalDB
