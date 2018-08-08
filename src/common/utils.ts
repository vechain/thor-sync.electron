export const generateKSFilename = function(address: string): string {
  var ts = new Date()
  return ['UTC--', ts.toJSON().replace(/:/g, '-'), '--', address].join('')
}
