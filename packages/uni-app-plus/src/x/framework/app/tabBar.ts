import { isString } from '@vue/shared'
import { getCurrentPage, invokeHook } from '@dcloudio/uni-core'
import { getPageManager } from './app'
import { Event } from '@dcloudio/uni-app-x/types/native'
import { getRealPath } from '../route'
import { getAllPages } from '../../../service/framework/page/getCurrentPages'
import { ComponentPublicInstance } from 'vue'
import { ON_HIDE, ON_SHOW } from '@dcloudio/uni-shared'
import { registerPage } from '../page'
import { showWebview } from '../../api/route/webview'

type Page = ComponentPublicInstance

let tabBar0: ITabsNode | null = null
let selected0: number = -1
let tabs = new Map<string, Page>()

const BORDER_COLORS = new Map<string, string>([
  ['white', 'rgba(255, 255, 255, 0.33)'],
  ['black', 'rgba(0, 0, 0, 0.33)'],
])

export function getBorderStyle(borderStyle: string): string {
  const value = BORDER_COLORS.get(borderStyle)
  return value ?? borderStyle
}

function fixBorderStyle(tabBarConfig: Map<string, any>) {
  let borderStyle = tabBarConfig.get('borderStyle')
  if (!isString(borderStyle)) {
    borderStyle = 'black'
  }
  tabBarConfig.set('borderStyle', getBorderStyle(borderStyle as string))
}

function getTabList() {
  const tabConfig = __uniConfig.tabBar ? new Map<string, any>() : null //__uniConfig.tabBar
  if (__uniConfig.tabBar) {
    for (const key in __uniConfig.tabBar) {
      tabConfig!.set(
        key,
        __uniConfig.tabBar[key as keyof typeof __uniConfig.tabBar]
      )
    }
  }
  if (tabConfig === null) {
    return null
  }
  const list = tabConfig!.get('list') as Record<string, any>[] | undefined
  return list
}

function init() {
  const list = getTabList()
  const style = new Map<string, any | null>()
  style.set('navigationStyle', 'custom')
  const page = getPageManager().createPage('tabBar', 'tabBar', style)
  const document = page.createDocument(
    new NodeData(
      'root',
      'view',
      new Map(),
      new Map<string, any | null>([['flex', '1']])
    )
  )
  var tabParent = document.createElement(
    new NodeData(
      'tabs',
      'tabs',
      new Map(),
      new Map<string, any | null>([
        ['overflow', 'hidden'],
        ['flex', '1'],
      ])
    )
  )
  document.appendChild(tabParent)
  tabBar0 = document.getRealDomNodeById<ITabsNode>('tabs')
  const tabBarConfig = new Map<string, any>()
  for (const key in __uniConfig.tabBar) {
    tabBarConfig.set(
      key,
      __uniConfig.tabBar[key as keyof typeof __uniConfig.tabBar]
    )
  }
  fixBorderStyle(tabBarConfig)
  tabBar0!.initTabBar(tabBarConfig)
  tabBar0!.addEventListener('tabBarItemTap', function (event: Event) {
    const index = (event as TabTapEvent).index
    if (index !== selected0) {
      const item = list![index]
      const path = item.pagePath
      if (isString(path) && findPageRoute(getRealPath(path, true))) {
        switchSelect(index, path as string)
      } else {
        console.error('switchTab: pagePath not found')
      }
    }
  })
  // TODO tabBarMidButtonTap
  // tabBar0!.addEventListener('tabBarMidButtonTap', function (event: Event) {
  //   invokeOnCallback('onTabBarMidButtonTap', [])
  // })

  page.startRender()
  page.show(null)
}

export function initTabBar(): boolean {
  const list = getTabList()
  if (!list || list.length == 0) {
    return false
  }
  const entryPagePath = __uniConfig.entryPagePath!
  selected0 = getTabIndex(entryPagePath, list)
  if (selected0 == -1) {
    return false
  }
  switchSelect(selected0, entryPagePath)
  return true
}

export function clearTabBarStatus() {
  tabBar0 = null
  selected0 = -1
  tabs.clear()
}

export function removeTabBarPage(page: Page) {
  const pagePath = getRealPath(page.route, true)
  if (tabs.get(pagePath) === page) {
    tabs.delete(pagePath)
    if (getTabIndex(pagePath) === selected0) {
      selected0 = -1
    }
  }
  // TODO tabs.size === 0 remove tabBar
}

export function getTabBar(): ITabsNode | null {
  return tabBar0
}

export function getTabIndex(path: string, list = getTabList()): number {
  let selected: number = -1
  if (list && list.length !== 0) {
    for (let index = 0; index < list.length; index++) {
      const page = list[index]
      const pagePath = page.pagePath
      if (
        isString(pagePath) &&
        getRealPath(pagePath as string, true) == getRealPath(path, true)
      ) {
        selected = index
        break
      }
    }
  }
  return selected
}

function findPageRoute(path: string) {
  return __uniRoutes.find((route) => route.path === path)!
}

function createTab(
  path: string,
  query: Record<string, string>,
  callback?: () => void
): Page {
  showWebview(
    registerPage({ url: path, path, query, openType: 'switchTab' }),
    'none',
    0,
    callback
  )
  const page = getCurrentPage() as Page
  tabBar0!.appendItem(page!.$page.id.toString())
  return page
}

function findTabPage(path: string): Page | null {
  // let page: Page | null = null
  // const pages = getAllPages()
  // for (let index = 0; index < pages.length; index++) {
  //   const item = pages[index]
  //   if (item.route == path) {
  //     page = item
  //   }
  // }
  // return page
  const page = tabs.get(path) ?? null
  // fix CurrentPage
  const pages = getAllPages()
  pages.forEach((item) => (item.$.__isActive = item === page))
  // 暂时同时保留安卓端逻辑
  if (page !== null) {
    const index = pages.indexOf(page!)
    if (index !== pages.length - 1) {
      pages.splice(index, 1)
      pages.push(page!)
    }
  }
  return page
}

export function isTabPage(page: Page): boolean {
  let has = false
  tabs.forEach((value: Page, key: string) => {
    if (value === page) {
      has = true
    }
  })
  return has
}

class TabPageInfo {
  constructor(public page: Page, public isFirst: boolean) {}
}

function getTabPage(
  path: string,
  query: Record<string, string> = {},
  rebuild: boolean = false,
  callback?: () => void
): TabPageInfo {
  let page = findTabPage(path)
  let isFirst = false
  if (page === null || rebuild) {
    isFirst = true
    page = createTab(path, query, callback)
    tabs.set(path, page!)
  }
  return new TabPageInfo(page, isFirst)
}

export function switchSelect(
  selected: number,
  path: string,
  query: Record<string, string> = {},
  rebuild: boolean = false,
  callback?: () => void
) {
  let shouldShow = false
  if (tabBar0 === null) {
    init()
  }
  const currentPage = getCurrentPage() as Page

  // const type = currentPage == null ? 'appLaunch' : 'switchTab'
  // 执行beforeRoute
  // invokeArrayFns(beforeRouteHooks, type)

  const pageInfo = getTabPage(getRealPath(path, true), query, rebuild, callback)
  const page = pageInfo.page
  if (currentPage !== page) {
    shouldShow = true
    if (currentPage && isTabPage(currentPage)) {
      invokeHook(currentPage!, ON_HIDE)
    }
  }
  tabBar0!.switchSelect(page!.$page.id.toString(), selected)

  // TODO use page show status
  if (shouldShow) {
    // resetNavigatorLock()
    invokeHook(page!, ON_SHOW)
  }
  selected0 = selected

  // 执行afterRoute
  // invokeArrayFns(afterRouteHooks, type)
}
