import { Account } from './types'
import * as DB from './db'
import * as File from './file'

export const list = function(): Account[] {
  return DB.getAccounts()
}
export const add = function(account: Account): void {
  DB.addAccount(account)
}
export const remove = function(address: string): void {
  DB.removeAccount(address)
}
export const hasAccount = function(address: string): boolean {
  return DB.hasAccount(address)
}
export const update = function(address: string, account: Account): void {
  DB.updateAccount(address, account)
}

export const getKeystore = function(address: string): object {
  let filename = DB.getFilenameByAddress(address)
  return File.getKeystoreByFilename(filename)
}
