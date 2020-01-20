import { app, Menu, MenuItemConstructorOptions } from 'electron'

export function setupMenu() {
    if (process.platform === 'darwin') {
        const template: MenuItemConstructorOptions[] = [
            {
                label: app.name,
                submenu: [{
                    label: `About ${app.name}`,
                    click: () => app.EXTENSION.showAbout()
                },
                { type: 'separator' },
                { role: 'services'},
                { type: 'separator' },
                { role: 'hide' },
                { role: 'hideOthers' },
                { role: 'unhide' },
                { type: 'separator' },
                { role: 'quit' }
                ]
            }, {
                label: 'Edit',
                submenu: [
                    { role: 'undo' },
                    { role: 'redo' },
                    { type: 'separator' },
                    { role: 'cut' },
                    { role: 'copy' },
                    { role: 'paste' },
                    { role: 'pasteAndMatchStyle' },
                    { role: 'delete' },
                    { role: 'selectAll' },
                    { type: 'separator' },
                    {
                        label: 'Speech',
                        submenu: [
                            { role: 'startSpeaking' },
                            { role: 'stopSpeaking' }
                        ]
                    }
                ]
            }, {
                label: 'View',
                submenu: [{ role: 'togglefullscreen' }]
            }, {
                role: 'window',
                submenu: [
                    { role: 'minimize' },
                    { role: 'zoom' },
                    { type: 'separator' },
                    { role: 'front' }
                ]
            },
        ]
        Menu.setApplicationMenu(Menu.buildFromTemplate(template))
    }
}
