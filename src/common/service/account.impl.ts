import { Account, IAccountsService } from './account.interface'

export class AccountSvc implements IAccountsService {
  list(): Account[] {
    throw new Error('Method not implemented.')
  }
  add(account: Account): void {
    throw new Error('Method not implemented.')
  }
  remove(address: string): void {
    throw new Error('Method not implemented.')
  }
  update(address: string, account: Account): void {
    throw new Error('Method not implemented.')
  }
  getFilenameByAddress(address: string): string {
    throw new Error('Method not implemented.')
  }
}
