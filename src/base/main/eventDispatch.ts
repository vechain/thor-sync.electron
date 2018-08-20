import { EventNames, EventData } from '../eventConst'
const webContents = require('electron').webContents
const receivers = webContents.getAllWebContents().filter(function(item) {
  return item.id !== 1
})

export function send(data: EventData) {
  receivers.forEach(item => {
    item.send(EventNames.sync_channel, data)
  })
}
