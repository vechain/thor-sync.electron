import { WebContents, ContextMenuParams, MenuItemConstructorOptions, clipboard } from 'electron'
import env from '@/env'
import * as V from './validator'

export function buildContextMenu(wc: WebContents, props: ContextMenuParams) {
    const hasSelection = !!props.selectionText
    const isWebview = !!wc.hostWebContents
    const items: MenuItemConstructorOptions[] = []


    if (props.isEditable || hasSelection) {
        items.push(
            {
                id: 'cut',
                label: 'Cut',
                enabled: props.editFlags.canCut,
                visible: props.isEditable,
                click: () => wc.cut()
            }, {
                id: 'copy',
                label: 'Copy',
                enabled: props.editFlags.canCopy,
                click: () => wc.copy()
            }, {
                id: 'paste',
                label: 'Paste',
                enabled: props.editFlags.canPaste,
                visible: props.isEditable,
                click: () => wc.paste()
            })
    }

    if (isWebview) {
        const { download } = require('electron-dl')
        if (props.mediaType === 'image') {
            items.push(
                {
                    id: 'save',
                    label: 'Save Image',
                    click: (item, win) => {
                        download(win, props.srcURL, { saveAs: true })
                    },
                }, {
                    id: 'copyImageLink',
                    label: 'Copy Image Link',
                    click: () => {
                        clipboard.write({
                            bookmark: props.srcURL,
                            text: props.srcURL
                        })
                    },
                })
        } else if (props.linkURL) {
            items.push({
                id: 'copyLink',
                label: 'Copy Link',
                click: () => {
                    clipboard.write({
                        bookmark: props.linkText,
                        text: props.linkURL,
                    })
                }
            })
        }
    }

    if (isWebview || env.devMode) {
        if (items.length > 0) {
            items.push({ type: 'separator' })
        }

        if (isWebview && (V.isAddress(props.selectionText) || V.isBytes32(props.selectionText))) {
            items.push({
                id: 'insight',
                label: 'Open in Insight',
                click: () => BUS.$emit('open-tab', { href: props.selectionText })
            })
        }

        items.push({
            id: 'inspect',
            label: 'Inspect Element',
            click: () => {
                wc.inspectElement(props.x, props.y)
                if (wc.isDevToolsOpened()) {
                    wc.devToolsWebContents.focus()
                }
            }
        })
    }
    return items
}
