import {
  API_OPEN_DOCUMENT,
  API_TYPE_OPEN_DOCUMENT,
  defineAsyncApi,
  OpenDocumentProtocol,
  OpenDocumentOptions,
} from '@dcloudio/uni-api'
import { warpPlusErrorCallback } from '../../../helpers/plus'
import { getRealPath } from '../../../platform/getRealPath'

export const openDocument = defineAsyncApi<API_TYPE_OPEN_DOCUMENT>(
  API_OPEN_DOCUMENT,
  ({ filePath, fileType }, { resolve, reject }) => {
    const errorCallback = warpPlusErrorCallback(reject)
    plus.runtime.openDocument(
      getRealPath(filePath),
      undefined,
      resolve,
      errorCallback
    )
  },
  OpenDocumentProtocol,
  OpenDocumentOptions
)
