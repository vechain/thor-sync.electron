import { BasePath } from '@/base'
import { generateKSFilename } from '@/base/utils'
const Fs = require('file-system')
const Path = require('path')

const ksFolder = BasePath.keystores

export const getKeystoreByFilename = function(filename: string): object {
  let temp = Path.join(ksFolder, filename)
  let keystoreStr = Fs.readFileSync(temp, 'utf8')
  return JSON.parse(keystoreStr)
}

export const removeKs = function(filename: string): void {
  let temp = Path.join(ksFolder, filename)
  Fs.unlink(temp)
}

export const updateKeyStore = function(filename: string, ks: object) {
  let temp = Path.join(ksFolder, filename)

  Fs.writeFileSync(temp, JSON.stringify(ks))
}

export const updateKsFilename = function(filename: string, address: string) {
  let newName = generateKSFilename(address)
  Fs.renameSync(Path.join(ksFolder, filename), Path.join(ksFolder, newName))
  return newName
}

export const saveKeystore = function(ks: object | any): string {
  let address = ks.address
  let filename = generateKSFilename(address)

  Fs.writeFileSync(Path.join(ksFolder, filename), JSON.stringify(ks))

  return filename
}
