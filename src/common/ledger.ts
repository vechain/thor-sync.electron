import Transport from 'ledgerhq__hw-transport'
import { default as App, StatusCodes } from '@vechain/hw-app-vet'
import HdNoEvent, { getDevices } from '@ledgerhq/hw-transport-node-hid-noevents'
import { sleep } from './sleep'
import 'babel-polyfill'

const connector: { connect(): Promise<Transport>, product: () => string | undefined } | null = (() => {
  return {
    connect: () => HdNoEvent.open(''),
    product: () => getDevices()[0].product
  }
})()

const supported = !!connector

const path = `44'/818'/0'/0`

function connect() {
  if (!connector) {
    throw new Error('unsupported')
  }

  return connector.connect()
}

const getVet = async () => {
  for (; ;) {
    let tr: any
    try {
      try {
        tr = await connect()
      } catch (error) {
        console.warn(error)
        await sleep(2000)
        continue
      }

      const app = await new App(tr)
      try {
        const account = await app.getAccount(path, false, true)
        return {
          instance: app,
          close: async () => {
            tr && await tr.close().catch(() => { })
          }
        }
      } catch (error) {
        console.warn(error)
        await sleep(2000)
        continue
      }
    } catch (error) {
      console.warn(error)
      tr && await tr.close().catch(() => { })
    }
  }
}

const showAccount = async (index: number) => {
  const vet = await getVet()
  try {
    await vet!.instance.getAccount(`${path}/${index}`, true, false)
  } catch (error) {
    throw error
  } finally {
    await vet!.close()
  }
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
        vet!.instance.signTransaction(`${path}/${index}`, rawTx)
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
      vet!.instance.signJSON(`${path}/${index}`, rawJson).then(originSig => {
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

export default {
  supported,
  connector,
  connect,
  App,
  path,
  StatusCodes,
  showAccount,
  signTransaction,
  signCert
}
