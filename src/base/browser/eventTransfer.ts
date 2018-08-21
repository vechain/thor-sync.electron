import { ipcRenderer } from 'electron'
import { syncEventTarget, SyncEvent } from '@/base/browser/eventsDefine'
import { EventNames, EventData } from '@/base/eventConst'

let Win = window as any

ipcRenderer.on(EventNames.sync_channel, function(e: any, data: EventData) {
  console.log(data)
  if (
    process.env.NODE_ENV === 'development' ||
    Win.DAppStatus === 'debug'
  ) {
    console.log('Event Name:' + data.name, 'Event Data:' + data.data)
  }
  let event = new SyncEvent(data.name, data.data)
  syncEventTarget.dispatchEvent(event)
})

Win.$syncEvents = syncEventTarget
