import { randomBytes } from 'crypto'
// tslint:disable-next-line: variable-name no-var-requires
// const Keythereum = require('keythereum')

// code copied from old version of devkit
// the purpose is to use native module to speed up encrypt/decrypt

/**
 * encrypt private key to keystore with given password
 * @param privateKey the private key to be encrypted
 * @param password password to encrypt the private key
 */
export function encrypt(privateKey: Buffer, password: string) {
    return new Promise<Keystore>(resolve => {
        // Keythereum.dump(password, privateKey, randomBytes(32), randomBytes(16), {
        //     cipher: 'aes-128-ctr',
        //     kdf: 'scrypt',
        //     kdfparams: {
        //         dklen: 32,
        //         memory: 280000000,
        //         n: 262144,
        //         p: 1,
        //         r: 8,
        //     },
        // }, resolve)
    })
}

/**
 * decrypt private key from keystore
 * an error thrown if not well formed
 * @param ks the keystore
 * @param password password to decrypt keystore
 */
export function decrypt(ks: Keystore, password: string) {
    return new Promise<Buffer>((resolve, reject) => {
        // Keythereum.recover(password, validate(normalize(ks)), (r: Buffer | Error) => {
        //     if (!Buffer.isBuffer(r)) {
        //         return reject(r)
        //     }
        //     resolve(r)
        // })
    })
}

/**
 * roughly check whether keystore is well formed
 * @param ks the keystore
 */
export function wellFormed(ks: any): ks is Keystore {
    try {
        validate(normalize(ks))
        return true
    } catch {
        return false
    }
}

/** normalize keystore. e.g. lower case keys */
function normalize(obj: object) {
    const lowerKey = (o: object) => {
        return Object.keys(o).reduce((converted, k) => {
            let v = (o as any)[k]
            if (typeof v === 'object') {
                v = lowerKey(v)
            }
            converted[k.toLowerCase()] = v
            return converted
        }, {} as any)
    }
    return lowerKey(obj)
}

function validate(ks: Keystore) {
    if (ks.version !== 1 && ks.version !== 3) {
        throw new Error('unsupported version')
    }
    if (!/^[0-9a-f]{40}$/i.test(ks.address)) {
        throw new Error('invalid address')
    }
    if (!/^[0-9a-z]{8}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{12}$/i.test(ks.id)) {
        throw new Error('invalid id')
    }
    if (typeof ks.crypto !== 'object') {
        throw new Error('invalid crypto')
    }
    return ks
}
