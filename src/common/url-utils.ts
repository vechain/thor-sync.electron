import * as NodeUrl from 'url'
import * as V from './validator'
const knownProtocols = [
    'http:',
    'https:',
    'file:',
    'sync:'
]

export function formalize(input: string, fallbackSearchEngine?: 'duckduckgo' | 'google' | 'bing') {
    input = (input || '').trim()
    if (!input) {
        return ''
    }
    if (V.isAddress(input) || V.isBytes32(input) ||
        (parseInt(input, 10).toString() === input && V.isUint32(parseInt(input, 10)))) {
        return `https://vechain.github.io/insight/search?q=${input}`
    }

    let url = NodeUrl.parse(input)
    if (url.protocol && knownProtocols.indexOf(url.protocol) >= 0) {
        if (url.path || url.host) {
            return NodeUrl.format(url)
        }
        return search(input, fallbackSearchEngine)
    }

    url = NodeUrl.parse('http://' + input)
    if (/^[a-z0-9]{1,61}(?:\.[a-z]{2,})+$/i.test(url.hostname || '')) {
        return NodeUrl.format(url)
    }
    return search(input, fallbackSearchEngine)
}

export function hostOf(url: string) {
    return NodeUrl.parse(url).host || ''
}

export function hostnameOf(url: string) {
    return NodeUrl.parse(url).hostname || ''
}

export function search(q: string, se?: 'duckduckgo' | 'google' | 'bing') {
    const encodedQ = encodeURIComponent(q)
    if (se === 'google') {
        return `https://www.google.com/search?q=${encodedQ}`
    } else if (se === 'bing') {
        return `https://bing.com/search?q=${encodedQ}`
    } else {
        return `https://duckduckgo.com/?q=${encodedQ}`
    }
}

export function prettyForDisplay(url: string) {
    const host = hostOf(url)
    if (!host) {
        return ''
    }
    if (host.startsWith('www.')) {
        return host.slice(4)
    }
    return host
}

export function filePathToUrl(path: string) {
    // WHATWG URL
    try {
        return new NodeUrl.URL(`file:///${path}`).href
    } catch (err) {
        return ''
    }
}

export function baseUrlOf(href: string) {
    try {
        return new NodeUrl.URL(href).origin
    } catch (err) {
        return ''
    }
}

export function hasPath(href: string) {
    const pathname = NodeUrl.parse(href).pathname
    return pathname && pathname !== '/'
}

export function parseDappUrl(dappUrl: string): { network: string, url: string } | null {
    try {
        const parsed = NodeUrl.parse(dappUrl)
        if (parsed.protocol !== 'vechain-app:') {
            return null
        }
        const network = parsed.host || 'mainnet'
        let pathname = parsed.pathname || ''
        while (pathname.startsWith('/')) {
            pathname = pathname.slice(1)
        }
        return {
            network,
            url: decodeURIComponent(pathname)
        }
    } catch {
        return null
    }
}

export function stripOptions(url: string) {
    try {
        const parsed = NodeUrl.parse(url)
        parsed.query = ''
        parsed.search = ''
        parsed.hash = ''
        return NodeUrl.format(parsed)
    } catch (err) {
        return ''
    }
}
