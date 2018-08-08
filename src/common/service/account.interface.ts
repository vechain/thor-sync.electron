export type Account = {
  name: string

  address: string

  hint: string

  filename: string
}

export interface IAccountsService {
  list(): Account[]

  add(account: Account): void

  remove(address: string): void

  update(address: string, account: Account): void

  getFilenameByAddress(address: string): string
}
