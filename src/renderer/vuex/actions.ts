import { getDApps } from '@/renderer/../base/'

export const getBuildInDapps = () => {
    const result: object[] = []
    const names = getDApps()

    names.forEach(name => {
        result.push({
            name: name,
            url: new URL(`${name}.html`, window.ENV.dapps).href
        })
    })

    return result
}
