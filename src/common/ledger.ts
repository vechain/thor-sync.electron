import { UsbMonitor } from '@vechain/usb-monitor'
import VET from '@vechain/hw-app-vet'
import 'babel-polyfill'
import * as TransportNodeHid from '@ledgerhq/hw-transport-node-hid'

let transporting = false
const usbM = new UsbMonitor(11415)
const getUsbM = () => {
  return usbM
}

const getVet = async () => {
  const path = getDevice()!.path
  if (transporting) {
    Promise.reject('')
  }
  if (path) {
    transporting = true
    const tspt = await TransportNodeHid.default.open(path)
    return {
      instance: new VET(tspt),
      close: async () => {
        await tspt.close()
        transporting = false
      }
    }
  }
}

const showAccount = async (index: number) => {
  const vet = await getVet()
  try {
    await vet!.instance.getAccount(`44'/818'/0'/0/${index}`, true, false)
  } catch (error) {
    throw error
  } finally {
    await vet!.close()
  }
}

const getAccount = async () => {
  const vet = await getVet()
  let result
  try {
    result = await vet!.instance.getAccount(`44'/818'/0'/0`, false, true)
  } catch (error) {
    throw error
  } finally {
    await vet!.close()
  }
  return result
}

const signTransaction = async (index: number, rawTx: Buffer, delegatorSig?: string) => {
  let timer: any
  return new Promise<Buffer>((res, rej) => {
    return getVet()
      .then(vet => {
        timer = setTimeout(() => {
          vet!.close()
          rej(new Error('Ledger confirmation timeout!'))
        }, 30000)
        vet!.instance.signTransaction(`44'/818'/0'/0/${index}`, rawTx)
          .then(originSig => {
            clearTimeout(timer)
            vet!.close()
            if (delegatorSig) {
              return res(Buffer.concat([originSig, Buffer.from(delegatorSig.slice(2), 'hex')]))
            } else {
              return res(originSig)
            }
          }).catch(e => {
            vet!.close()
            clearTimeout(timer)
            return rej(e)
          })
      }).catch(e => {
        clearTimeout(timer)
        return rej(e)
      })
  })
}

const signCert = async (index: number, rawJson: Buffer) => {
  let timer: any
  return new Promise<Buffer>((res, rej) => {
    return getVet().then(vet => {
      timer = setTimeout(() => {
        vet!.close()
        rej(new Error('Ledger confirmation timeout!'))
      }, 30000)
      vet!.instance.signJSON(`44'/818'/0'/0/${index}`, rawJson).then(originSig => {
        vet!.close()
        clearTimeout(timer)
        return res(originSig)
      }).catch(e => {
        vet!.close()
        clearTimeout(timer)
        return rej(e)
      })
    }).catch(e => {
      clearTimeout(timer)
      return rej(e)
    })
  })
}

const getStatus = () => {
  let result = 0
  const devices = usbM.devices()
  if (devices.length) {
    result = 1
  }
  const list = devices.filter((dvc) => {
    return ['win32', 'darwin'].indexOf(process.platform) >= 0
      ? dvc.usagePage === 0xffa0
      : dvc.interface === 0
  })

  if (list.length) {
    result = 2
  }

  return result
}

const getDevice = () => {
  const devices = usbM.devices()
  const list = devices.filter((dvc) => {
    return ['win32', 'darwin'].indexOf(process.platform) >= 0
      ? dvc.usagePage === 0xffa0
      : dvc.interface === 0
  })
  if (list.length) {
    return list[0]
  } else {
    return null
  }
}

export default {
  getUsbM,
  getStatus,
  getAccount,
  getDevice,
  signTransaction,
  signCert,
  showAccount
}
