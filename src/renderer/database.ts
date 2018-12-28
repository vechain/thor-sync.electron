import Dexie from 'dexie'
import { cry } from 'thor-devkit'
import { ipcRenderer, remote } from 'electron'
import { EventEmitter } from 'events'

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


const emitters = new Map<string, EventEmitter>()

ipcRenderer.on('db-event', (_: any, event: DbEvent) => {
    const emitter = emitters.get(`${event.db}.${event.table}`)
    if (emitter) {
        emitter.emit('event', event.changes)
    }
})

export interface Table<T, Key> extends Dexie.Table<T, Key> {
    subscribe(cb: (changes: DbEvent['changes']) => void): { unsubscribe: () => void }
}

class Database extends Dexie {
    protected constructor(dbName: string, init: (dexie: Dexie) => void) {
        super(dbName)
        init(this)

        this.tables.forEach(table => {
            (this as any)[table.name] = table;
            (table as Table<any, any>).subscribe = cb => {
                const key = `${dbName}.${table.name}`
                let emitter = emitters.get(key)
                if (!emitter) {
                    emitter = new EventEmitter()
                    emitter.setMaxListeners(0)
                    emitters.set(key, emitter)
                }
                const listener = (changes: DbEvent['changes']) => {
                    cb(changes)
                }
                emitter.addListener('event', listener)
                return {
                    unsubscribe: () => emitter!.removeListener('event', listener)
                }
            }
        })
        this.open()
            .then(() => {
                this.tables.forEach(table => {
                    let timer: any
                    const changesSet = new Set<DbEvent['changes'][number]>()
                    const dispatch = (change: DbEvent['changes'][number]) => {

                        changesSet.add(change)
                        if (!timer) {
                            timer = setTimeout(() => {
                                timer = undefined
                                const changes = [...changesSet]
                                changesSet.clear()
                                remote.app.EXTENSION.dispatchDbEvent({
                                    db: dbName,
                                    table: table.name,
                                    changes
                                })
                            }, 200)
                        }
                    }

                    table.hook('creating', function() {
                        this.onsuccess = () => dispatch('creating')
                    })
                    table.hook('updating', function() {
                        this.onsuccess = () => dispatch('updating')
                    })
                    table.hook('deleting', function() {
                        this.onsuccess = () => dispatch('deleting')
                    })
                })
            })
            // tslint:disable-next-line:no-console
            .catch(err => console.error(err))

    }
}

export class GlobalDatabase extends Database {
    public readonly preferences!: Table<Entities.Preference, number>
    public readonly accessRecords!: Table<entities.AccessRecord, number>

    constructor() {
        super('global', (dexie: Dexie) => {
            dexie.version(1).stores({
                preferences: '++id, key',
                accessRecords: '++id, &baseUrl, lastAccessTime, *tokens'
            })
        })
    }
}

export class BoundedDatabase extends Database {
    public readonly wallets!: Table<Entities.Wallet, number>
    public readonly activities!: Table<entities.Activity<'tx' | 'cert'>, number>

    constructor(network: string) {
        super(network, (dexie: Dexie) => {
            dexie.version(1).stores({
                wallets: '++id, &address, name',
                activities: '++id, type, createdTime, closed',
            })
        })
    }
}
