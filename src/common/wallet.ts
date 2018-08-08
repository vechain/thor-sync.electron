import { cry } from 'thor-devkit'

type Keystore = cry.Keystore

export const exportPrivateKey = function(
  keystore: Keystore,
  pwd: string
): Promise<string> {
  return cry.Keystore.decrypt(keystore, pwd).then(privateKey => {
    return privateKey.toString('hex')
  })
}
export const generateMnemonic = function(): string[] {
  return cry.mnemonic.generate()
}
export const create = function(pwd: string): Promise<Keystore> {
  let privateKey = cry.secp256k1.generatePrivateKey()
  return cry.Keystore.encrypt(privateKey, pwd)
}

export const resetPwdByAddress = function(
  keystore: Keystore,
  oldPwd: string,
  newPwd: string
): Promise<Keystore> {
  return cry.Keystore.decrypt(keystore, oldPwd).then(privateKey => {
    return cry.Keystore.encrypt(privateKey, newPwd)
  })
}

export const checkPwdByKeyStore = function(
  keyStore: object,
  pwd: string
): Promise<boolean> {
  return new Promise(resolve => {
    try {
      cry.Keystore.decrypt(keyStore as Keystore, pwd).then(() => {
        resolve(true)
      })
    } catch (e) {
      resolve(false)
    }
  })
}

export const generateByMnemonic = function(
  mnemonic: string[],
  pwd: string
): Promise<object> {
  let privateKey = cry.mnemonic.derivePrivateKey(mnemonic)

  return cry.Keystore.encrypt(privateKey, pwd)
}

export const validateMnemonic = function(mnemonic: string[]): boolean {
  return cry.mnemonic.validate(mnemonic)
}
