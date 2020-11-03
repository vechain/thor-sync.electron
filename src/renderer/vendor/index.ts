import Vendor from './Vendor.vue'
import { DriverInterface } from '@vechain/connex-driver/dist/driver-interface'

export default Vendor

declare global {
    interface Window {
        VENDOR: {
            signTx(
                msg: DriverInterface.SignTxArg,
                option: DriverInterface.SignTxOption,
                caller: {
                    referer: Referer
                    webContentsId: number
                }
            ): Promise<DriverInterface.SignTxResult>
            signCert(
                msg: DriverInterface.SignCertArg,
                option: DriverInterface.SignCertOption,
                caller: {
                    referer: Referer
                    webContentsId: number
                }
            ): Promise<DriverInterface.SignCertResult>
            isAddressOwned(addr: string): Promise<boolean>
        }
    }
}
