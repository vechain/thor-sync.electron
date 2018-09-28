import { app, Menu, MenuItemConstructorOptions } from 'electron'


export function setupMenu() {
    // this template is copied from https://electronjs.org/docs/api/menu
    const template: MenuItemConstructorOptions[] = [
        {
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
                { role: 'selectall' }
            ]
        },
        {
            label: 'View',
            submenu: [
                { role: 'reload' },
                { role: 'forcereload' },
                { role: 'toggledevtools' },
                { type: 'separator' },
                { role: 'resetzoom' },
                { role: 'zoomin' },
                { role: 'zoomout' },
                { type: 'separator' },
                { role: 'togglefullscreen' }
            ]
        },
        {
            role: 'window',
            submenu: [
                { role: 'minimize' },
                { role: 'close' }
            ]
        },
        {
            role: 'help',
            submenu: [
                {
                    label: 'Learn More',
                    click() { require('electron').shell.openExternal('https://electronjs.org') }
                }
            ]
        }
    ]

    if (process.platform === 'darwin') {
        // template.unshift({
        //     label: 'File',
        //     submenu: app.backend.siteConfigs.map<MenuItemConstructorOptions>((config, i) => {
        //         return {
        //             label: `New Window '${config.name}'`,
        //             accelerator: i === 0 ? 'Cmd+N' : undefined,
        //             click() {
        //                 app.createWindow(config)
        //             }
        //         }
        //     })
        // })

        template.unshift({
            label: app.getName(),
            submenu: [
                { role: 'about' },
                { type: 'separator' },
                { role: 'services', submenu: [] },
                { type: 'separator' },
                { role: 'hide' },
                { role: 'hideothers' },
                { role: 'unhide' },
                { type: 'separator' },
                { role: 'quit' }
            ]
        });

        // Edit menu
        (template[1].submenu as MenuItemConstructorOptions[]).push(
            { type: 'separator' },
            {
                label: 'Speech',
                submenu: [
                    { role: 'startspeaking' },
                    { role: 'stopspeaking' }
                ]
            }
        )

        // Window menu
        template[3].submenu = [
            { role: 'close' },
            { role: 'minimize' },
            { role: 'zoom' },
            { type: 'separator' },
            { role: 'front' }
        ]
    }

    // const dockTemplate = app.backend.siteConfigs.map<MenuItemConstructorOptions>(config => {
    //     return {
    //         label: `New Window '${config.name}'`,
    //         click() {
    //             app.createWindow(config)
    //         }
    //     }
    // })

    // if (process.platform === 'darwin') {
    //     app.dock.setMenu(Menu.buildFromTemplate(dockTemplate))
    // }
    Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}
