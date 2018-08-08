// src="~@/assets/logo.png"
import { cry } from 'thor-devkit'

export type Keystore = cry.Keystore

export interface IWalletService {
  create(pwd: string): Promise<Keystore>

  resetPwdByAddress(keystore: Keystore, oldPwd: string, newPwd: string):Promise<Keystore>

  checkPwdByKeyStore(keyStore: object, pwd: string): Promise<boolean>

  generateByMnemonic(mnemonic: string[], pwd: string): Promise<object>

  generateMnemonic(): string[]

  validateMnemonic(mnemonic: string[]): boolean

  exportPrivateKey(keystore: Keystore, pwd: string): Promise<string>
}
