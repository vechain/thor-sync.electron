import Dexie from 'dexie'
import 'dexie-observable'
import { cry } from 'thor-devkit'

export namespace Entities {
    export interface Wallet {
        id?: number
        address?: string
        name?: string
        keystore?: cry.Keystore
    }

    export interface Preference {
        id?: number
        key: string
        value: any
    }
}

class Database extends Dexie {
    public readonly wallets!: Dexie.Table<Entities.Wallet, string>

    constructor() {
        super('main')
        this.version(1).stores({
            wallets: '++id, &address, name',
            preferences: '++id, key'
        })
        this.open().catch(err => {
            // tslint:disable-next-line:no-console
            console.error(err)
        })
    }
}

export default Database
