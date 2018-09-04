import { ipcRenderer } from 'electron'
import { syncEventTarget, SyncEvent } from '@/base/browser/eventsDefine'
import { EventNames, EventData } from '@/base/eventConst'

const Win = window as any

ipcRenderer.on(EventNames.sync_channel, (e: any, data: EventData) => {
  if (
    process.env.NODE_ENV === 'development' ||
    Win.DAppStatus === 'debug'
  ) {
    // console.log('Event Name:' + data.name, 'Event Data:' + data.data)
  }
  const event = new SyncEvent(data.name, data.data)
  syncEventTarget.dispatchEvent(event)
})

Win.$syncEvents = syncEventTarget
