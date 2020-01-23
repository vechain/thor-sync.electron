import * as crypto from 'crypto'
import { Buffer } from 'buffer'
import { cry } from 'thor-devkit'
import UUID from 'uuid'
// use the native kdf methods(crypto.scrypt/crypto.pbkdf2) from node to speed up encrypt / decrypt

type CryptoOptions = {
    cipher: string;
    kdf: 'scrypt' | 'pbkdf2';
    kdfparams: {
        [index: string]: string | number
    };
    cipherparams: {
        iv: string
    }
    [index: string]: any;
}

/**
 * encrypt private key to keystore with given password
 * @param privateKey the private key to be encrypted
 * @param password password to encrypt the private key
 */
export async function encrypt(privateKey: Buffer, password: string): Promise<Keystore> {
    const pw = Buffer.from(password, 'utf8')
    const salt = crypto.randomBytes(32)
    const iv = crypto.randomBytes(16)

    const options: CryptoOptions = {
        cipher: 'aes-128-ctr',
        kdf: 'scrypt',
        kdfparams: {
            dklen: 32,
            n: 262144,
            p: 1,
            r: 8,
            salt: salt.toString('hex')
        },
        cipherparams: {
            iv: iv.toString('hex')
        }
    }

    const key = await deriveKey(pw, salt, options)
    const cipherText = CIPHER.encrypt(privateKey, key.slice(0, 16), iv, options.cipher)
    const mac = computeMAC(key.slice(16, 32), cipherText)

    const keyStoreObj = {
        address: cry.publicKeyToAddress(cry.secp256k1.derivePublicKey(privateKey)).toString('hex'),
        crypto: {
            ...options,
            ciphertext: cipherText.toString('hex'),
            mac: mac.toString('hex'),
        },
        id: UUID.v4(),
        version: 3
    }
    return keyStoreObj
}

/**
 * decrypt private key from keystore
 * an error thrown if not well formed
 * @param ks the keystore
 * @param password password to decrypt keystore
 */
export async function decrypt(ks: Keystore, password: string) {
    const pw = Buffer.from(password, 'utf8')
    const keyStoreObj = validate(normalize(ks))
    const options = keyStoreObj.crypto as CryptoOptions
    const salt = Buffer.from(options.kdfparams.salt as string, 'hex')
    const iv = Buffer.from(options.cipherparams.iv, 'hex')
    const cipherText = Buffer.from(options.ciphertext as string, 'hex')

    if (options.kdf === 'pbkdf2' && options.kdfparams.prf !== 'hmac-sha256') {
        throw new Error('PBKDF2 only supported with HMAC-SHA256')
    }

    const key = await deriveKey(pw, salt, options)
    const mac = computeMAC(key.slice(16, 32), cipherText)
    if (mac.toString('hex') !== options.mac as string) {
        throw new Error('message authentication code mismatch')
    }

    let decipherKey = key.slice(0, 16)
    if (keyStoreObj.version === 1) {
        decipherKey = cry.keccak256(key.slice(0, 16)).slice(0, 16)
    }
    const  priv = CIPHER.decrypt(cipherText, decipherKey, iv, options.cipher)
    return priv
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
    const lowed = lowerKey(obj)
    // the version is string('1') in version 1, normalize to number(1)
    if (lowed.version === '1') {
        lowed.version = 1
    }
    return lowed
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

const deriveKey = (password: Buffer, salt: Buffer, options: CryptoOptions): Promise<Buffer> => {
    if (options.kdf === 'scrypt') {
        return new Promise((resolve, reject) => {
            crypto.scrypt(password, salt, options.kdfparams.dklen as number, {
                N: options.kdfparams.n as number,
                r: options.kdfparams.r as number,
                p: options.kdfparams.p as number,
                maxmem: 2 ** 53 - 1
            }, (err, key) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(key)
                }
            })
        })
    } else if (options.kdf === 'pbkdf2') {
        return new Promise((resolve, reject) => {
            crypto.pbkdf2(
                password,
                salt,
                options.kdfparams.c as number,
                options.kdfparams.dklen as number,
                'sha256',
                (err, key) => {
                    if (err) {
                        reject(err)
                    } else {
                        resolve(key)
                    }

                }
            )
        })
    }
    throw new Error('unsupported kdf')
}

const computeMAC = (key: Buffer, ciphertext: Buffer) => {
    return cry.keccak256(Buffer.concat([key, ciphertext]))
}

const CIPHER = {
    encrypt: (input: Buffer, key: Buffer, iv: Buffer, algo: string) => {
        const all = crypto.getCiphers()
        if (!all.some(x => x === algo)) {
            throw new Error('unsupported cipher: ' + algo)
        }
        const cipher = crypto.createCipheriv(algo, key, iv)
        const data = cipher.update(input)
        return Buffer.concat([data, cipher.final()])
    },
    decrypt: (input: Buffer, key: Buffer, iv: Buffer, algo: string) => {
        const all = crypto.getCiphers()
        if (!all.some(x => x === algo)) {
            throw new Error('unsupported cipher: ' + algo)
        }
        const decipher = crypto.createDecipheriv(algo, key, iv)
        const data = decipher.update(input)
        return Buffer.concat([data, decipher.final()])
    }
}
