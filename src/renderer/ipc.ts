import { ipcRenderer, remote } from 'electron'
import UUID from 'uuid'

export function ipcServe(
    channel: string,
    handler: (fromWebContentsId: number, methodName: string, arg: any) => Promise<any>): { stop: () => void } {
    const listener = async (ev: any, payload: Payload) => {
        try {
            const result = await handler(payload.replyTo.webContentsId, payload.methodName, payload.arg)
            ipcRenderer.sendTo(payload.replyTo.webContentsId, payload.replyTo.channel, undefined, result)
        } catch (err) {
            ipcRenderer.sendTo(payload.replyTo.webContentsId, payload.replyTo.channel, err)
        }
    }
    ipcRenderer.on(channel, listener)
    return {
        stop: () => ipcRenderer.removeListener(channel, listener)
    }
}

export function ipcCall(server: Endpoint, methodName: string, arg: any) {
    const replyChannel = UUID.v4()
    const payload: Payload = {
        replyTo: {
            webContentsId: remote.getCurrentWebContents().id,
            channel: replyChannel
        },
        methodName,
        arg
    }
    return new Promise<any>((resolve, reject) => {
        ipcRenderer.on(replyChannel, (ev: any, err: any, result: any) => {
            ipcRenderer.removeAllListeners(replyChannel)
            if (err) {
                return reject(err)
            }
            resolve(result)
        })
        ipcRenderer.sendTo(server.webContentsId, server.channel, payload)
    })
}


type Endpoint = {
    webContentsId: number
    channel: string
}

type Payload = {
    replyTo: Endpoint
    methodName: string
    arg: any
}
