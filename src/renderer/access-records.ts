
import * as UrlUtils from '@/common/url-utils'

export async function record(href: string, title?: string, favicon?: string) {
    const baseUrl = UrlUtils.baseUrlOf(href)
    const now = Date.now()

    await GDB.transaction('rw', GDB.accessRecords, async () => {
        const affect = await GDB.accessRecords.where({ baseUrl })
            .modify(obj => {
                const newAccess = obj.lastAccessTime - now > 5 * 60 * 1000

                obj.lastAccessTime = now
                if (newAccess) {
                    obj.accessCount++
                }

                if (!obj.pages.some(p => {
                    if (p.href === href) {
                        if (newAccess) {
                            p.accessCount++
                        }
                        p.title = title || p.title
                        p.favicon = favicon || p.favicon
                        return true
                    }
                    return false
                })) {
                    obj.pages.push({
                        title: title || '',
                        favicon: favicon || '',
                        accessCount: 1,
                        href
                    })
                }

                obj.pages.sort((a, b) => {
                    return b.accessCount - a.accessCount ||
                        a.href.length - b.href.length
                })

                if (obj.pages.length > 10) {
                    obj.pages.pop()
                }
                const tokens = new Set<string>()
                tokenizeHref(obj.pages[0].href).forEach(t => tokens.add(t))
                tokenizeTitle(obj.pages[0].title).forEach(t => tokens.add(t))
                obj.tokens = [...tokens]
            })

        if (!affect) {
            const tokens = new Set<string>()
            tokenizeHref(href).forEach(t => tokens.add(t))
            if (title) {
                tokenizeTitle(title).forEach(t => tokens.add(t))
            }
            await GDB.accessRecords.add({
                baseUrl,
                lastAccessTime: now,
                tokens: [...tokens],
                accessCount: 1,
                pages: [{
                    title: title || '',
                    href,
                    accessCount: 1,
                    favicon: favicon || ''
                }]
            })
        }
    })
}

export async function query(keyword: string) {
    keyword = keyword.split(' ').filter(p => !!p).join(' ')
    return GDB.transaction('r', GDB.accessRecords, async () => {
        const items = await GDB.accessRecords
            .where('tokens')
            .startsWithIgnoreCase(keyword)
            .distinct()
            .toArray()

        if (items.length === 0) {
            // assume keyword is url
            const baseUrl = UrlUtils.baseUrlOf(keyword)
            if (baseUrl) {
                const x = await GDB.accessRecords.get({ baseUrl })
                if (x && x.pages.some(p => p.href.startsWith(keyword))) {
                    items.push(x)
                }
            }
        }
        return items
    })
}

export async function queryFavicon(href: string) {
    const baseUrl = UrlUtils.baseUrlOf(href)

    const row = await GDB.accessRecords
        .get({ baseUrl })

    if (row) {
        const optionsStripped = UrlUtils.stripOptions(href)
        const r = row.pages.find(p => UrlUtils.stripOptions(p.href) === optionsStripped)
        if (r) {
            return r.favicon
        }
        return row.pages[0].favicon
    }
    return ''
}

function tokenizeTitle(title: string) {
    const parts = title.split(' ').filter(p => p && p.length > 1)
    const tokens = []
    for (let i = 0; i < parts.length; i++) {
        tokens.push(parts.slice(i).join(' '))
    }
    return tokens
}

function tokenizeHref(href: string) {
    const hostname = UrlUtils.hostnameOf(href)
    const parts = hostname.split('.')

    const tokens = []
    for (let i = 0; i < parts.length - 1; i++) {
        tokens.push(parts.slice(i).join('.'))
    }
    return tokens
}
