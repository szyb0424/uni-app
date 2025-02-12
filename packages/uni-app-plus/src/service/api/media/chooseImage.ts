import { TEMP_PATH } from '../constants'
import { warpPlusErrorCallback } from '../../../helpers/plus'
import {
  API_TYPE_CHOOSE_IMAGE,
  API_CHOOSE_IMAGE,
  ChooseImageProtocol,
  ChooseImageOptions,
  defineAsyncApi,
} from '@dcloudio/uni-api'
import { initI18nChooseImageMsgsOnce, useI18n } from '@dcloudio/uni-core'

/**
 * 获取文件信息
 * @param {string} filePath 文件路径
 * @returns {Promise} 文件信息Promise
 */
function getFileInfo(filePath: string): Promise<PlusIoMetadata> {
  return new Promise((resolve, reject) => {
    plus.io.resolveLocalFileSystemURL(
      filePath,
      function (entry) {
        entry.getMetadata(resolve, reject, false)
      },
      reject
    )
  })
}

type File = {
  path: string
  size: number
}

export const chooseImage = defineAsyncApi<API_TYPE_CHOOSE_IMAGE>(
  API_CHOOSE_IMAGE,
  ({ count, sizeType, sourceType, crop } = {}, { resolve, reject }) => {
    initI18nChooseImageMsgsOnce()
    const { t } = useI18n()
    const errorCallback = warpPlusErrorCallback(reject)

    function successCallback(paths: string[]) {
      const tempFiles: File[] = []
      const tempFilePaths: string[] = []

      Promise.all(paths.map((path) => getFileInfo(path)))
        .then((filesInfo) => {
          filesInfo.forEach((file, index) => {
            const path = paths[index]
            tempFilePaths.push(path)
            tempFiles.push({ path, size: file.size! })
          })

          resolve({
            tempFilePaths,
            tempFiles,
          })
        })
        .catch(errorCallback)
    }

    function openCamera() {
      const camera = plus.camera.getCamera()
      camera.captureImage((path) => successCallback([path]), errorCallback, {
        filename: TEMP_PATH + '/camera/',
        resolution: 'high',
        crop,
        // @ts-expect-error
        sizeType,
      })
    }

    function openAlbum() {
      // @ts-ignore 5+此API分单选和多选，多选返回files:string[]
      plus.gallery.pick(({ files }) => successCallback(files), errorCallback, {
        maximum: count,
        multiple: true,
        system: false,
        filename: TEMP_PATH + '/gallery/',
        permissionAlert: true,
        crop,
        // @ts-expect-error
        sizeType,
      })
    }

    if (sourceType!.length === 1) {
      if (sourceType!.includes('album')) {
        openAlbum()
        return
      } else if (sourceType!.includes('camera')) {
        openCamera()
        return
      }
    }

    plus.nativeUI.actionSheet(
      {
        cancel: t('uni.chooseImage.cancel'),
        buttons: [
          {
            title: t('uni.chooseImage.sourceType.camera'),
          },
          {
            title: t('uni.chooseImage.sourceType.album'),
          },
        ],
      },
      (e) => {
        switch (e.index) {
          case 1:
            openCamera()
            break
          case 2:
            openAlbum()
            break
          default:
            errorCallback()
            break
        }
      }
    )
  },
  ChooseImageProtocol,
  ChooseImageOptions
)
