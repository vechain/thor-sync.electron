import { BasePath } from './index'
const Fs = require('file-system')
const Path = require('path')

export const getKeystoreByFilename = function(filename: string): object {
  let temp = Path.join(BasePath.keystores, filename)
  let keystoreStr = Fs.readFileSync(temp, 'utf8')
  return JSON.parse(keystoreStr)
}

export const removeKs = function(filename: string): void {
  let temp = Path.join(BasePath.keystores, filename)
  Fs.unlink(temp)
}
