import Dexie from 'dexie'
import { ipcRenderer, remote } from 'electron'
import { EventEmitter } from 'events'

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

                    table.hook('creating', function () {
                        this.onsuccess = () => dispatch('creating')
                    })
                    table.hook('updating', function () {
                        this.onsuccess = () => dispatch('updating')
                    })
                    table.hook('deleting', function () {
                        this.onsuccess = () => dispatch('deleting')
                    })
                })
            })
            .catch(err => {
                LOG.warn('Database:', 'open error', err)
                let btnIndex = 0
                remote.dialog.showMessageBox(
                    remote.getCurrentWindow(), {
                    type: 'error',
                    buttons: ['Exit', 'Continue'],
                    defaultId: 0,
                    title: 'Critical Error',
                    message: `Failed to open IndexedDB\n${err.toString()}`
                }).then((r: Electron.MessageBoxReturnValue) => {
                    btnIndex = r.response
                })
                if (btnIndex === 0) {
                    remote.app.quit()
                }
            })

    }
}

export class GlobalDatabase extends Database {
    public readonly accessRecords!: Table<entities.AccessRecord, number>
    public readonly nodes !: Table<entities.Node, number>
    public readonly shortcuts!: Table<entities.Shortcut, number>
    private readonly preferences!: Table<entities.Preference, number> // deprecated

    constructor() {
        super('global', (dexie: Dexie) => {
            dexie.version(1).stores({
                preferences: '++id, key', // deprecated
                accessRecords: '++id, &baseUrl, lastAccessTime, *tokens',
                nodes: '++id',
                shortcuts: '++id',
            })
        })
    }
}

export class BoundedDatabase extends Database {
    public readonly wallets!: Table<entities.Wallet, number>
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

export class LedgerDatabase extends Database {
    public readonly devices!: Table<entities.LedgerDevice, number>
    constructor(network: string) {
        super(network, (dexie: Dexie) => {
            dexie.version(1).stores({
                devices: '++id, &publicKey, chainCode, name'
            })
        })
    }
}

// from now on, we use one table per db strategy to resolve migration problem
export class Preferences extends Database {
    public readonly store !: Table<entities.Preference, string>

    constructor() {
        super('preferences', (dexie: Dexie) => {
            dexie.version(1).stores({
                store: '&key'
            })
        })
    }
}
