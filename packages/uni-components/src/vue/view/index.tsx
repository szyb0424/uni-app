import { extend } from '@vue/shared'
import { ref, onMounted } from 'vue'
import { defineBuiltInComponent } from '../../helpers/component'
import { UniElement } from '../../helpers/UniElement'
import { hoverProps, useHover } from '../../helpers/useHover'

export class UniViewElement extends UniElement {}
export default /*#__PURE__*/ defineBuiltInComponent({
  name: 'View',
  props: extend({}, hoverProps),
  //#if _X_ && !_NODE_JS_
  rootElement: {
    name: 'uni-view',
    class: UniViewElement,
  },
  //#endif
  setup(props, { slots }) {
    const rootRef = ref<HTMLElement | null>(null)
    const { hovering, binding } = useHover(props)

    //#if _X_ && !_NODE_JS_
    onMounted(() => {
      const rootElement = rootRef.value as UniViewElement
      rootElement.attachVmProps(props)
    })
    //#endif
    return () => {
      const hoverClass = props.hoverClass
      if (hoverClass && hoverClass !== 'none') {
        return (
          <uni-view
            class={hovering.value ? hoverClass : ''}
            ref={rootRef}
            {...binding}
          >
            {slots.default && slots.default()}
          </uni-view>
        )
      }
      return (
        <uni-view ref={rootRef}>{slots.default && slots.default()}</uni-view>
      )
    }
  },
})
