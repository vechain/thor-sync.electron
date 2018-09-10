import Axios, { AxiosInstance } from 'axios'
import * as QS from 'qs'
import * as URL from 'url'
import { Agent } from 'http'

export class Wire implements WireInterface {
    private readonly axios: AxiosInstance
    constructor(readonly genesisId: string, readonly url: string, readonly agent?: Agent) {
        this.axios = Axios.create({
            validateStatus: status => status >= 200 && status < 300,
            httpAgent: agent,
            headers: { 'x-genesis-id': genesisId }
        })
    }

    public async get<T>(path: string, query?: object): Promise<T> {
        const url = this.resolve(path, query)
        const result = await this.axios.get<T>(url)
        return result.data
    }
    public async post<T>(path: string, data: object, query?: object): Promise<T> {
        const url = this.resolve(path, query)
        const result = await this.axios.post<T>(url, data)
        return result.data
    }
    public resolve(
        path: string,
        query?: object
    ): string {
        let qs = QS.stringify(query)
        if (qs) {
            qs = '?' + qs
        }
        return URL.resolve(this.url, `${path}${qs}`)
    }
}
