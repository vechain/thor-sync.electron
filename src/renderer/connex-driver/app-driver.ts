import { remote } from 'electron'
import { ipcCall, ipcServe } from '../ipc'
import { blake2b256 } from 'thor-devkit/dist/cry/blake2b'
import UUID from 'uuid'
const wc = remote.getCurrentWebContents()

export class AppDriver implements Connex.Driver {
    public readonly genesis: Connex.Thor.Block
    public head: Connex.Thor.Status['head']
    constructor() {
        const nodeConfig = remote.getCurrentWindow()
            .webContents
            .getWebPreferences()
            .nodeConfig!

        this.genesis = nodeConfig.genesis
        const configId = blake2b256(JSON.stringify(nodeConfig)).toString('hex')
        const initialHead = remote.app.EXTENSION.knownHeads.get(configId)

        this.head = initialHead || {
            id: this.genesis.id,
            number: this.genesis.number,
            parentID: this.genesis.parentID,
            timestamp: this.genesis.timestamp,
            txsFeatures: this.genesis.txsFeatures
        }
    }

    public pollHead(): Promise<Connex.Thor.Status['head']> {
        return this.callToHost('pollHead').then(h => {
            this.head = h
            return h
        })
    }
    public getBlock(revision: string | number): Promise<Connex.Thor.Block | null> {
        return this.callToHost('getBlock', revision)
    }
    public getTransaction(id: string): Promise<Connex.Thor.Transaction | null> {
        return this.callToHost('getTransaction', id)
    }
    public getReceipt(id: string): Promise<Connex.Thor.Receipt | null> {
        return this.callToHost('getReceipt', id)
    }
    public getAccount(addr: string, revision: string): Promise<Connex.Thor.Account> {
        return this.callToHost('getAccount', addr, revision)
    }
    public getCode(addr: string, revision: string): Promise<Connex.Thor.Code> {
        return this.callToHost('getCode', addr, revision)
    }
    public getStorage(addr: string, key: string, revision: string): Promise<Connex.Thor.Storage> {
        return this.callToHost('getStorage', addr, key, revision)
    }
    public explain(
        arg: Connex.Driver.ExplainArg,
        revision: string,
        cacheTies?: string[]
    ): Promise<Connex.Thor.VMOutput[]> {
        return this.callToHost('explain', arg, revision, cacheTies)
    }
    public filterEventLogs(arg: Connex.Driver.FilterEventLogsArg): Promise<Connex.Thor.Event[]> {
        return this.callToHost('filterEventLogs', arg)
    }
    public filterTransferLogs(arg: Connex.Driver.FilterTransferLogsArg): Promise<Connex.Thor.Transfer[]> {
        return this.callToHost('filterTransferLogs', arg)
    }
    public signTx(
        msg: Connex.Driver.SignTxArg,
        option: Connex.Driver.SignTxOption
    ): Promise<Connex.Vendor.TxResponse> {
        let delegationHandlerId
        if (option.delegationHandler) {
            delegationHandlerId = UUID.v4()
            const s = ipcServe(delegationHandlerId, async (fromWebContentsId, method, arg) => {
                try {
                    return await option.delegationHandler!(arg)
                } catch (err) {
                    throw { name: err.name, message: err.message }
                } finally {
                    s.stop()
                }
            })
        }
        return this.callToHost('signTx', msg, option, delegationHandlerId)
    }
    public signCert(
        msg: Connex.Vendor.CertMessage,
        option: Connex.Driver.SignCertOption
    ): Promise<Connex.Vendor.CertResponse> {
        return this.callToHost('signCert', msg, option)
    }
    public isAddressOwned(addr: string): boolean {
        return remote.app.EXTENSION.isWalletOwned(remote.getCurrentWindow().id, addr)
    }

    private async callToHost(method: string, ...args: any[]) {
        try {
            return await ipcCall({
                webContentsId: wc.hostWebContents.id,
                channel: 'driver'
            }, method, args)
        } catch (err) {
            throw new ConnexError(err.message)
        }
    }
}

class ConnexError extends Error {
    constructor(msg: string) {
        super(msg)
    }
}

ConnexError.prototype.name = 'ConnexError'
