import { Ref, ref, computed, watch, onMounted, HTMLAttributes } from 'vue'
import { extend } from '@vue/shared'
import { LINEFEED } from '@dcloudio/uni-shared'
import { defineBuiltInComponent } from '../../helpers/component'
import { UniElement } from '../../helpers/UniElement'
import {
  props as fieldProps,
  emit as fieldEmit,
  useField,
} from '../../helpers/useField'
import ResizeSensor from '../resize-sensor/index'

const props = /*#__PURE__*/ extend({}, fieldProps, {
  placeholderClass: {
    type: String,
    default: 'input-placeholder',
  },
  autoHeight: {
    type: [Boolean, String],
    default: false,
  },
  confirmType: {
    type: String,
    default: 'return',
    validator(val: string) {
      return ConfirmTypes.concat('return').includes(val)
    },
  },
})

let fixMargin: Boolean = false
const ConfirmTypes = ['done', 'go', 'next', 'search', 'send'] // 'return'

function setFixMargin() {
  // iOS 13 以下版本需要修正边距
  const DARK_TEST_STRING = '(prefers-color-scheme: dark)'
  fixMargin = __NODE_JS__
    ? false
    : String(navigator.platform).indexOf('iP') === 0 &&
      String(navigator.vendor).indexOf('Apple') === 0 &&
      window.matchMedia(DARK_TEST_STRING).media !== DARK_TEST_STRING
}

export class UniTextareaElement extends UniElement {
  focus(options?: FocusOptions | undefined): void {
    this.querySelector('textarea')?.focus(options)
  }
}
export default /*#__PURE__*/ defineBuiltInComponent({
  name: 'Textarea',
  props,
  emits: ['confirm', 'linechange', ...fieldEmit],
  //#if _X_ && !_NODE_JS_
  rootElement: {
    name: 'uni-textarea',
    class: UniTextareaElement,
  },
  //#endif
  setup(props, { emit, expose }) {
    const rootRef: Ref<HTMLElement | null> = ref(null)
    const wrapperRef: Ref<HTMLElement | null> = ref(null)
    const { fieldRef, state, scopedAttrsState, fixDisabledColor, trigger } =
      useField(props, rootRef, emit)
    const valueCompute = computed(() => state.value.split(LINEFEED))
    const isDone = computed(() => ConfirmTypes.includes(props.confirmType))
    const heightRef = ref(0)
    const lineRef: Ref<HTMLElement | null> = ref(null)
    watch(
      () => heightRef.value,
      (height) => {
        const el = rootRef.value as HTMLElement
        const lineEl = lineRef.value as HTMLElement
        const wrapper = wrapperRef.value as HTMLElement
        let lineHeight = parseFloat(getComputedStyle(el).lineHeight)
        if (isNaN(lineHeight)) {
          lineHeight = lineEl.offsetHeight
        }
        var lineCount = Math.round(height / lineHeight)
        trigger('linechange', {} as Event, {
          height,
          heightRpx: (750 / window.innerWidth) * height,
          lineCount,
        })
        if (props.autoHeight) {
          el.style.height = 'auto'
          wrapper.style.height = height + 'px'
        }
      }
    )

    function onResize({ height }: { height: number }) {
      heightRef.value = height
    }

    function confirm(event: Event) {
      trigger('confirm', event, {
        value: state.value,
      })
    }

    function onKeyDownEnter(event: Event) {
      if ((event as KeyboardEvent).key !== 'Enter') {
        return
      }
      if (isDone.value) {
        event.preventDefault()
      }
    }

    function onKeyUpEnter(event: Event) {
      if ((event as KeyboardEvent).key !== 'Enter') {
        return
      }
      if (isDone.value) {
        confirm(event)
        const textarea = event.target as HTMLTextAreaElement
        !props.confirmHold && textarea.blur()
      }
    }

    if (__NODE_JS__) {
      onMounted(setFixMargin)
    } else {
      setFixMargin()
    }

    expose({
      $triggerInput: (detail: { value: string }) => {
        emit('update:modelValue', detail.value)
        emit('update:value', detail.value)
        state.value = detail.value
      },
    })

    //#if _X_ && !_NODE_JS_
    onMounted(() => {
      const rootElement = rootRef.value as UniTextareaElement
      Object.defineProperty(rootElement, 'value', {
        get() {
          return state.value
        },
        set(value: string) {
          rootElement.querySelector('textarea')!.value = value
        },
      })
      rootElement.attachVmProps(props)
    })
    //#endif

    return () => {
      let textareaNode =
        props.disabled && fixDisabledColor ? (
          <textarea
            key="disabled-textarea"
            ref={fieldRef}
            value={state.value}
            tabindex="-1"
            readonly={!!props.disabled}
            maxlength={state.maxlength}
            class={{
              'uni-textarea-textarea': true,
              'uni-textarea-textarea-fix-margin': fixMargin,
            }}
            style={{
              overflowY: props.autoHeight ? 'hidden' : 'auto',
              /* eslint-disable no-restricted-syntax */
              ...(props.cursorColor && { caretColor: props.cursorColor }),
            }}
            // fix: 禁止 readonly 状态获取焦点
            onFocus={(event: Event) =>
              (event.target as HTMLInputElement).blur()
            }
          />
        ) : (
          <textarea
            key="textarea"
            ref={fieldRef}
            value={state.value}
            disabled={!!props.disabled}
            maxlength={state.maxlength}
            // @ts-ignore
            enterkeyhint={props.confirmType}
            inputmode={props.inputmode as HTMLAttributes['inputmode']}
            class={{
              'uni-textarea-textarea': true,
              'uni-textarea-textarea-fix-margin': fixMargin,
            }}
            style={{
              overflowY: props.autoHeight ? 'hidden' : 'auto',
              /* eslint-disable no-restricted-syntax */
              ...(props.cursorColor && { caretColor: props.cursorColor }),
            }}
            onKeydown={onKeyDownEnter}
            onKeyup={onKeyUpEnter}
          />
        )
      return (
        <uni-textarea ref={rootRef}>
          <div ref={wrapperRef} class="uni-textarea-wrapper">
            <div
              v-show={!state.value.length}
              {...scopedAttrsState.attrs}
              style={props.placeholderStyle}
              class={['uni-textarea-placeholder', props.placeholderClass]}
            >
              {props.placeholder}
            </div>
            <div ref={lineRef} class="uni-textarea-line">
              {' '}
            </div>
            <div class="uni-textarea-compute">
              {valueCompute.value.map((item) => (
                <div>{item.trim() ? item : '.'}</div>
              ))}
              {/* @ts-ignore */}
              <ResizeSensor initial onResize={onResize} />
            </div>
            {props.confirmType === 'search' ? (
              <form action="" onSubmit={() => false} class="uni-input-form">
                {textareaNode}
              </form>
            ) : (
              textareaNode
            )}
          </div>
        </uni-textarea>
      )
    }
  },
})
