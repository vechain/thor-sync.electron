import { app, Menu, MenuItemConstructorOptions } from 'electron'

export function setupMenu() {
    if (process.platform === 'darwin') {
        const template: MenuItemConstructorOptions[] = [
            {
                label: app.getName(),
                submenu: [{
                    label: `About ${app.getName()}`,
                    click: () => app.EXTENSION.showAbout()
                },
                { type: 'separator' },
                { role: 'services', submenu: [] },
                { type: 'separator' },
                { role: 'hide' },
                { role: 'hideothers' },
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
                    { role: 'pasteandmatchstyle' },
                    { role: 'delete' },
                    { role: 'selectall' },
                    { type: 'separator' },
                    {
                        label: 'Speech',
                        submenu: [
                            { role: 'startspeaking' },
                            { role: 'stopspeaking' }
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
