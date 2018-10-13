import { cry } from 'thor-devkit'
import LocalDB from './local-db'

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
        address: string
        name: string
        keystore: cry.Keystore
        createdTime?: number
        order?: number
    }

    export class Persist extends LocalDB<Entity> {
        constructor() {
            super('sync', 'wallet_store')
        }
        public listSorted() {
            return this.list()
                .then(all => all.map(e => e[1]))
                .then(all => all.sort((a, b) => {
                    if (a.order !== b.order) {
                        return a.order! - b.order!
                    }
                    return a.createdTime! - b.createdTime!
                }))
        }

        public save(
            entity: Entity,
            force?: boolean) {
            entity = {
                ...entity,
                createdTime: entity.createdTime || Date.now(),
                order: entity.order || 0
            }
            return this.set(entity.address, entity, force)
        }
    }

    export function isEntity(v: any): v is Entity {
        return v &&
            cry.isAddress(v.address) &&
            cry.Keystore.wellFormed(v.keystore)
    }
}

export default Wallet
