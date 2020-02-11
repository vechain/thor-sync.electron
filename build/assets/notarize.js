const { notarize } = require('electron-notarize')

exports.default = async function notarizing(context) {
    const { electronPlatformName, appOutDir } = context

    if (electronPlatformName !== 'darwin') {
        return
    }

    if (!(process.env.APPLE_API_KEY && process.env.APPLE_API_ISSUER)) {
        console.warn(
            'Skipping macOS app notarization.' +
            ' Missing one or more environment vars (APPLE_API_KEY, APPLE_API_ISSUER).',
        )
        return
    }

    const appName = context.packager.appInfo.productFilename

    return await notarize({
        appBundleId: 'org.vechain.sync',
        appPath: `${appOutDir}/${appName}.app`,
        appleApiKey: process.env.APPLE_API_KEY,
        appleApiIssuer: process.env.APPLE_API_ISSUER,
    })
}