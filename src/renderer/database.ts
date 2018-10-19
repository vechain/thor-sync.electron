import Dexie from 'dexie'
import 'dexie-observable'
import { cry } from 'thor-devkit'

export namespace Entities {
    export interface Wallet {
        id?: number
        address?: string
        name?: string
        keystore?: cry.Keystore
        createdTime?: number
    }

    export interface Preference {
        id?: number
        key: string
        value: any
    }

    export class Network implements Preference {
        id?: number
        key: string = 'network'
        value: Settings.NetWork
        constructor(val: Settings.NetWork) {
            this.value = val
        }

        public static create(val: Settings.NetWork) {
            return new Network(val)
        }
    }

    export class Shortcut implements Preference {
        id?: number
        key: string = 'shortcut'
        value: Settings.Shortcut
        constructor(val: Settings.Shortcut) {
            this.value = val
        }

        public static create(val: Settings.Shortcut) {
            return new Shortcut(val)
        }
    }

    export function isWallet(v: any): v is Wallet {
        return (
            v && cry.isAddress(v.address) && cry.Keystore.wellFormed(v.keystore)
        )
    }
}

class Database extends Dexie {
    public readonly wallets!: Dexie.Table<Entities.Wallet, string>
    public readonly preferences!: Dexie.Table<Entities.Preference, string>

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
