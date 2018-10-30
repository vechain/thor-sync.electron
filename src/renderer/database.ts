import Dexie from 'dexie'
import 'dexie-observable'
import { cry } from 'thor-devkit'
import { IDatabaseChange } from 'dexie-observable/api';
// tslint:disable:no-console

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

    export interface TxRecord {
        id: string
        insertTime: number
        signer: string
        confirmed: 0 | 1
        raw: string
        referer: { url: string, title: string }
        summary: [string, string[]]
        link: string
        receipt: (Connex.Thor.Receipt & Connex.Thor.Transaction.Meta) | null
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
    public readonly txRecords!: Dexie.Table<Entities.TxRecord, string>


    constructor() {
        super('main')
        this.version(1).stores({
            wallets: '++id, &address, name',
            preferences: '++id, key',
            txRecords: 'id, insertTime, signer, confirmed'
        })
        this.open()
            .catch(err => console.error(err))
    }


    public subscribe(tableName: string, onChange: (...args: IDatabaseChange[]) => void) {
        const ev = this.on('changes')
        const fn = (...args: IDatabaseChange[]) => {
            args = args.filter(a => a.table === tableName)
            if (args.length > 0) {
                onChange(...args)
            }
        }
        ev.subscribe(fn)
        return {
            unsubscribe: () => ev.unsubscribe(fn)
        }
    }
}

export default Database
