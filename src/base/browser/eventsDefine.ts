type EventData = object | any
interface EventListener {
  [propName: string]: any[]
}
export class SyncEvent {
  private _data: EventData
  private _name: string
  constructor(name: string, data: EventData) {
    this._name = name
    this._data = data
  }
  set data(data: EventData) {
    this._data = data
  }
  get data(): EventData {
    return this._data
  }

  get name(): string {
    return this._name
  }
}

class SyncEventTarget {
  private listeners: EventListener

  constructor() {
    this.listeners = {}
  }

  addEventListener(eventName: string, callback: any) {
    if (!(eventName in this.listeners)) {
      this.listeners[eventName] = []
    }
    this.listeners[eventName].push(callback)
  }

  removeListener(eventName: string, callback?: any) {
    if (!(eventName in this.listeners)) {
      return
    }
    if (callback) {
      let index = this.listeners[eventName].findIndex(item => {
        return item === callback
      })
      if (index >= 0) {
        this.listeners[eventName].splice(index, 1)
      }
    } else {
      this.listeners[eventName] = []
    }
  }
  
  dispatchEvent(event: SyncEvent) {
    if (!(event.name in this.listeners)) {
      return true
    }

    let callbacks = this.listeners[event.name].slice()
    callbacks.forEach(item => {
      item.call(this, event)
    })

    return true
  }
}

export const syncEventTarget = new SyncEventTarget()
