import { camelize } from '@vue/shared'

function transformRpx(value: string) {
  if (/(-?(?:\d+\.)?\d+)[ur]px/gi.test(value)) {
    return value.replace(/(-?(?:\d+\.)?\d+)[ur]px/gi, (text, num) => {
      return `${uni.upx2px(parseFloat(num))}px`
    })
  }
  return value
}

export class UniElement extends HTMLElement {
  private _props: Record<string, any> = {}
  public __isUniElement: boolean
  constructor() {
    super()
    this.__isUniElement = true
  }

  attachVmProps(props: Record<string, any>) {
    this._props = props
  }

  getAttribute(qualifiedName: string): string | null {
    const name = camelize(qualifiedName)
    return name in this._props
      ? this._props[name] + ''
      : super.getAttribute(qualifiedName) || null
  }

  get style() {
    const originalStyle = super.style
    // @ts-ignore
    if (originalStyle.__patchRpx__) {
      return originalStyle
    }
    // @ts-ignore
    originalStyle.__patchRpx__ = true
    const originalSetProperty = originalStyle.setProperty.bind(originalStyle)
    super.style.setProperty = function (
      property: string,
      value: string | null,
      priority?: string
    ) {
      return originalSetProperty(
        property,
        value ? transformRpx(value + '') : value,
        priority || undefined
      )
    }
    return super.style
  }

  get tagName() {
    return super.tagName.replace(/^UNI-/, '')
  }

  get nodeName() {
    return super.nodeName.replace(/^UNI-/, '')
  }
}
