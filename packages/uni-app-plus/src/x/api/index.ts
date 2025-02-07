export { navigateTo } from './route/navigateTo'
export { navigateBack } from './route/navigateBack'
export { redirectTo } from './route/redirectTo'
export { switchTab } from './route/switchTab'
export { reLaunch } from './route/reLaunch'

export { setTabBarBadge } from './tabBar/setTabBarBadge'
export { removeTabBarBadge } from './tabBar/removeTabBarBadge'
export { setTabBarItem } from './tabBar/setTabBarItem'
export { setTabBarStyle } from './tabBar/setTabBarStyle'
export { hideTabBar } from './tabBar/hideTabBar'
export { showTabBar } from './tabBar/showTabBar'
export { showTabBarRedDot } from './tabBar/showTabBarRedDot'
export { hideTabBarRedDot } from './tabBar/hideTabBarRedDot'
// export { onTabBarMidButtonTap } from './tabBar/onTabBarMidButtonTap'

// navigation
export { setNavigationBarColor } from './navigationBar/setNavigationBarColor'
export { setNavigationBarTitle } from './navigationBar/setNavigationBarTitle'

// dom
export { getElementById } from './dom/getElementById'
export { pageScrollTo } from './dom/pageScrollTo'
export { createSelectorQuery } from './dom/createSelectorQuery'

// ui
export { loadFontFace } from './ui/loadFontFace'

// base
export { $emit, $off, $on, $once } from './base/event-bus'
export { removeInterceptor, addInterceptor } from './base/interceptor'
export { getLaunchOptionsSync } from './base/getLaunchOptionsSync'

export {
  initUTSProxyClass,
  initUTSProxyFunction,
  initUTSIndexClassName,
  initUTSClassName,
  initUTSPackageName,
  requireUTSPlugin,
  registerUTSPlugin,
  registerUTSInterface,
} from '../../service/api/plugin/uts'
