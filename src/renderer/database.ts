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

    export interface Preference<T extends 'shortcut' | 'network'
        = 'shortcut' | 'network'> {
        id?: number
        key: T
        value: T extends 'shortcut' ? Preference.Shortcut :
        T extends 'network' ? Preference.Network :
        (string | boolean)
    }

    export namespace Preference {
        export interface Shortcut {
            name: string
            href: string
        }
        export interface Network {
            name: string
            rpcUrl: string
        }
    }

    export interface TxRecord {
        id: string
        insertTime: number
        signer: string
        confirmed: 0 | 1
        raw: string
        referer: { url: string, title: string }
        summary: [string, string[]]
        link: string
        estimatedFee: string
        receipt: (Connex.Thor.Receipt & Connex.Thor.Transaction.Meta) | null
    }

    export interface History {
        href: string
        lastAccessTime: number
        tokens: string[]

        title: string
        favicon: string
        accessCount: number
    }

    export function isWallet(v: any): v is Wallet {
        return (
            v && cry.isAddress(v.address) && cry.Keystore.wellFormed(v.keystore)
        )
    }
}

class Database extends Dexie {
    public readonly wallets!: Dexie.Table<Entities.Wallet, number>
    public readonly preferences!: Dexie.Table<Entities.Preference, number>
    public readonly txRecords!: Dexie.Table<Entities.TxRecord, string>
    public readonly history!: Dexie.Table<Entities.History, string>

    constructor() {
        super('main')
        this.version(1).stores({
            wallets: '++id, &address, name',
            preferences: '++id, key',
            txRecords: 'id, insertTime, signer, confirmed',
            history: 'href, *tokens, lastAccessTime'
        })
        // tslint:disable-next-line:no-console
        this.open().catch(err => console.error(err))
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

export default Database
