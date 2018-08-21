import { BasePath } from '@/base'
import { Account } from '@/base/types'
const path = require('path')
const lowdb = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

const logFileName = path.join(BasePath.db, '/db.json')
const adapter = new FileSync(logFileName)
const db = lowdb(adapter)

db.defaults({ accounts: [] }).write()

export const getFilenameByAddress = function(address: string) {
  let account = db
    .get('accounts')
    .find({ address: address })
    .value()
  return account.filename
}

export const getAccounts = function(): Account[] {
  return db.get('accounts').value()
}

export const addAccount = function(account: Account) {
  return db
    .get('accounts')
    .push(account)
    .write()
}

export const removeAccount = function(address: string) {
  return db
    .get('accounts')
    .remove({ address: address })
    .write()
}

export const hasAccount = function(address: string): boolean {
  let account = db
    .get('accounts')
    .find({ address: address })
    .value()
  if (account) {
    return true
  } else {
    return false
  }
}

export const updateAccount = function(address: string, account: Account): void {
  db.get('accounts')
    .find({ address: address })
    .assign({
      hint: account.hint,
      filename: account.filename,
      name: account.name
    })
    .write()
}
