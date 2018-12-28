import Dexie from 'dexie'
import 'dexie-observable'
import { cry } from 'thor-devkit'
import { IDatabaseChange } from 'dexie-observable/api'

export namespace Entities {
    export interface Wallet {
        id?: number
        address?: string
        name?: string
        keystore?: cry.Keystore
        createdTime?: number
    }

    export interface Preference<T extends 'shortcut' | 'node'
        = 'shortcut' | 'node'> {
        id?: number
        key: T
        value: T extends 'shortcut' ? Preference.Shortcut :
        T extends 'node' ? Preference.Node :
        (string | boolean)
    }

    export namespace Preference {
        export type Shortcut = {
            name: string
            href: string
        }
        export type Node = NodeConfig
    }

    export function isWallet(v: any): v is Wallet {
        return (
            v && cry.isAddress(v.address) && cry.Keystore.wellFormed(v.keystore)
        )
    }
}

class Database extends Dexie {
    protected constructor(name: string) {
        super(name)

        setImmediate(() => {
            // tslint:disable-next-line:no-console
            this.open().catch(err => console.error(err))
        })
    }

    public subscribe(tableName: string, onChange: (changes: IDatabaseChange[]) => void) {
        const ev = this.on('changes')
        const fn = (changes: IDatabaseChange[]) => {
            changes = changes.filter(c => c.table === tableName)
            if (changes.length > 0) {
                onChange(changes)
            }
        }
        ev.subscribe(fn)
        return {
            unsubscribe: () => ev.unsubscribe(fn)
        }
    }
}

export class GlobalDatabase extends Database {
    public readonly preferences!: Dexie.Table<Entities.Preference, number>
    public readonly accessRecords!: Dexie.Table<entities.AccessRecord, number>

    constructor() {
        super('global')
        this.version(1).stores({
            preferences: '++id, key',
            accessRecords: '++id, &baseUrl, lastAccessTime, *tokens'
        })
    }
}

export class BoundedDatabase extends Database {
    public readonly wallets!: Dexie.Table<Entities.Wallet, number>
    public readonly activities!: Dexie.Table<entities.Activity<'tx' | 'cert'>, number>

    constructor(network: string) {
        super(network)
        this.version(1).stores({
            wallets: '++id, &address, name',
            activities: '++id, type, createdTime, closed',
        })
    }
}

