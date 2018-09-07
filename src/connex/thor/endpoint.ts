import Axios, { AxiosInstance } from 'axios'
import * as WebSocket from 'ws'
import * as QS from 'qs'
import * as URL from 'url'

export default class Endpoint {
    private readonly axios: AxiosInstance
    constructor(readonly baseURL: string) {
        this.axios = Axios.create({
            baseURL,
            validateStatus: status => status >= 200 && status < 300
        })
    }
    public async get<T>(path: string, query?: object) {
        let qs = QS.stringify(query)
        if (qs) {
            qs = '?' + qs
        }
        const result = await this.axios.get<T>(`${path}${qs}`)
        return result.data
    }
    public async post<T>(path: string, data?: object, query?: object) {
        let qs = QS.stringify(query)
        if (qs) {
            qs = '?' + qs
        }
        const result = await this.axios.post<T>(`${path}${qs}`, data)
        return result.data
    }

    public websocket(path: string, query?: object) {
        let qs = QS.stringify(query)
        if (qs) {
            qs = '?' + qs
        }
        const parsed = URL.parse(this.baseURL)
        if (parsed.protocol === 'https') {
            parsed.protocol = 'wss'
        } else {
            parsed.protocol = 'ws'
        }
        const url = URL.resolve(URL.format(parsed), `${path}${qs}`)
        return new WebSocket(url)
    }
}
