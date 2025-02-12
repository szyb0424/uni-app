import {
  defineAsyncApi,
  defineOnApi,
  defineOffApi,
  API_START_LOCATION_UPDATE,
  API_TYPE_START_LOCATION_UPDATE,
  StartLocationUpdateProtocol,
  StartLocationUpdateOptions,
  API_ON_LOCATION_CHANGE,
  API_TYPE_ON_LOCATION_CHANGE,
  API_TYPE_STOP_LOCATION_UPDATE,
  API_STOP_LOCATION_UPDATE,
  API_TYPE_OFF_LOCATION_CHANGE,
  API_OFF_LOCATION_CHANGE,
  API_TYPE_OFF_LOCATION_CHANGE_ERROR,
  API_OFF_LOCATION_CHANGE_ERROR,
  API_TYPE_ON_LOCATION_CHANGE_ERROR,
  API_ON_LOCATION_CHANGE_ERROR,
} from '@dcloudio/uni-api'

let started = false
let watchId: number = 0

export const startLocationUpdate =
  defineAsyncApi<API_TYPE_START_LOCATION_UPDATE>(
    API_START_LOCATION_UPDATE,
    (options, { resolve, reject }) => {
      watchId =
        watchId ||
        plus.geolocation.watchPosition(
          (res) => {
            started = true
            UniServiceJSBridge.invokeOnCallback(
              API_ON_LOCATION_CHANGE,
              res.coords
            )
          },
          (error) => {
            if (!started) {
              reject(error.message)
              started = true
            }
            UniServiceJSBridge.invokeOnCallback(API_ON_LOCATION_CHANGE_ERROR, {
              errMsg: `onLocationChange:fail ${error.message}`,
            })
          },
          {
            coordsType: options?.type,
          }
        )
      setTimeout(resolve, 100)
    },
    StartLocationUpdateProtocol,
    StartLocationUpdateOptions
  )

export const stopLocationUpdate = defineAsyncApi<API_TYPE_STOP_LOCATION_UPDATE>(
  API_STOP_LOCATION_UPDATE,
  (_, { resolve }) => {
    if (watchId) {
      plus.geolocation.clearWatch(watchId)
      started = false
      watchId = 0
    }
    resolve()
  }
)

export const onLocationChange = defineOnApi<API_TYPE_ON_LOCATION_CHANGE>(
  API_ON_LOCATION_CHANGE,
  () => {}
)

export const offLocationChange = defineOffApi<API_TYPE_OFF_LOCATION_CHANGE>(
  API_OFF_LOCATION_CHANGE,
  () => {}
)

export const onLocationChangeError =
  defineOnApi<API_TYPE_ON_LOCATION_CHANGE_ERROR>(
    API_ON_LOCATION_CHANGE_ERROR,
    () => {}
  )

export const offLocationChangeError =
  defineOffApi<API_TYPE_OFF_LOCATION_CHANGE_ERROR>(
    API_OFF_LOCATION_CHANGE_ERROR,
    () => {}
  )
