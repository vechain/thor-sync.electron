import { Keystore, IWalletService } from './wallet.interface'
import { cry } from 'thor-devkit'

export class WalletService implements IWalletService {
  exportPrivateKey (keystore: Keystore, pwd: string): Promise<string> {
    return cry.Keystore.decrypt(keystore, pwd).then(privateKey => {
      return privateKey.toString('hex')
    })
  }
  generateMnemonic(): string[] {
    return cry.mnemonic.generate()
  }
  create(pwd: string): Promise<Keystore> {
    let privateKey = cry.secp256k1.generatePrivateKey()
    return cry.Keystore.encrypt(privateKey, pwd)
  }

  resetPwdByAddress(
    keystore: Keystore,
    oldPwd: string,
    newPwd: string
  ): Promise<Keystore> {
    return cry.Keystore.decrypt(keystore, oldPwd).then(privateKey => {
      return cry.Keystore.encrypt(privateKey, newPwd)
    })
  }

  checkPwdByKeyStore(keyStore: object, pwd: string): Promise<boolean> {
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

  generateByMnemonic(mnemonic: string[], pwd: string): Promise<object> {
    let privateKey = cry.mnemonic.derivePrivateKey(mnemonic)

    return cry.Keystore.encrypt(privateKey, pwd)
  }

  validateMnemonic(mnemonic: string[]): boolean {
    return cry.mnemonic.validate(mnemonic)
  }
}
