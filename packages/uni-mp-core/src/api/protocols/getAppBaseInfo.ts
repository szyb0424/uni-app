import { MPProtocol } from './types'
import { extend } from '@vue/shared'
import { getHostName, getAppLanguage } from './enhanceSystemInfo'
import { sortObject } from '@dcloudio/uni-shared'

export const getAppBaseInfo: MPProtocol = {
  returnValue: (fromRes, toRes) => {
    const { version, language, SDKVersion, theme } = fromRes

    let _hostName = getHostName(fromRes)
    let hostLanguage = language.replace(/_/g, '-')

    toRes = sortObject(
      extend(toRes, {
        hostVersion: version,
        hostLanguage,
        hostName: _hostName,
        hostSDKVersion: SDKVersion,
        hostTheme: theme,
        appId: process.env.UNI_APP_ID,
        appName: process.env.UNI_APP_NAME,
        appVersion: process.env.UNI_APP_VERSION_NAME,
        appVersionCode: process.env.UNI_APP_VERSION_CODE,
        appLanguage: getAppLanguage(hostLanguage),
      })
    )
  },
}
