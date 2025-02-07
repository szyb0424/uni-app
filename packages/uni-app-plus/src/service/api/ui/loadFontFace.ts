import {
  API_LOAD_FONT_FACE,
  API_TYPE_LOAD_FONT_FACE,
  defineAsyncApi,
  LoadFontFaceProtocol,
} from '@dcloudio/uni-api'
import { getPageIdByVm, getCurrentPageVm } from '@dcloudio/uni-core'

export const loadFontFace = defineAsyncApi<API_TYPE_LOAD_FONT_FACE>(
  API_LOAD_FONT_FACE,
  (options, { resolve, reject }) => {
    const pageId = getPageIdByVm(getCurrentPageVm()!)!
    UniServiceJSBridge.invokeViewMethod(
      API_LOAD_FONT_FACE,
      options,
      pageId,
      (err: string) => {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      }
    )
  },
  LoadFontFaceProtocol
)
