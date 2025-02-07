import { camelize, isString } from '@vue/shared'
import {
  BindingTypes,
  CompoundExpressionNode,
  ConstantTypes,
  createCompoundExpression,
  createObjectProperty,
  createSimpleExpression,
  DirectiveNode,
  ElementTypes,
  ExpressionNode,
  hasScopeRef,
  IS_REF,
  isMemberExpression,
  isSimpleIdentifier,
  isStaticExp,
  NodeTypes,
  Property,
} from '@vue/compiler-core'
import { isCompoundExpressionNode } from '@dcloudio/uni-cli-shared'

import { DirectiveTransform } from '../transform'

import { createCompilerError, ErrorCodes } from '../errors'

const INPUT_TAGS = ['input', 'textarea']
const AS = ' as '

export const transformModel: DirectiveTransform = (dir, node, context) => {
  // 组件 v-model 绑定了复杂表达式，且没有手动 as 类型
  if (
    node.tagType === ElementTypes.COMPONENT &&
    (dir.exp as CompoundExpressionNode)?.children?.length > 1 &&
    !dir.loc.source.includes(AS)
  ) {
    context.onError(
      createCompilerError(100, dir.loc, {
        100: `When custom components use "v-model" to bind complex expressions, you must specify the type using "as", 详见：https://uniapp.dcloud.net.cn/uni-app-x/component/#v-model-complex-expression`,
      })
    )
  }

  const { exp, arg } = dir
  if (!exp) {
    context.onError(
      createCompilerError(ErrorCodes.X_V_MODEL_NO_EXPRESSION, dir.loc)
    )
    return createTransformProps()
  }

  let rawExp = exp.loc.source

  let expType = ''
  if (isCompoundExpressionNode(exp)) {
    if (rawExp.includes(AS)) {
      // 目前简单处理(a as string)
      if (rawExp.startsWith('(') && rawExp.endsWith(')')) {
        rawExp = rawExp.slice(1, -1)
      }
      const parts = rawExp.split(AS)
      rawExp = parts[0].trim()
      expType = parts[1].trim()
      let len = exp.children.length - 1
      exp.children = exp.children.filter((child, index) => {
        if (
          isString(child) &&
          (child.includes(AS) ||
            (index === 0 && child === '(') ||
            (index === len && child === ')'))
        ) {
          return false
        }
        return true
      })
    }
  }

  const expString =
    exp.type === NodeTypes.SIMPLE_EXPRESSION ? exp.content : rawExp

  // im SFC <script setup> inline mode, the exp may have been transformed into
  // _unref(exp)
  const bindingType = context.bindingMetadata[rawExp]

  // check props
  if (
    bindingType === BindingTypes.PROPS ||
    bindingType === BindingTypes.PROPS_ALIASED
  ) {
    context.onError(createCompilerError(ErrorCodes.X_V_MODEL_ON_PROPS, exp.loc))
    return createTransformProps()
  }

  const maybeRef =
    context.inline &&
    (bindingType === BindingTypes.SETUP_LET ||
      bindingType === BindingTypes.SETUP_REF ||
      bindingType === BindingTypes.SETUP_MAYBE_REF)

  if (
    !expString.trim() ||
    (!isMemberExpression(expString, context as any) && !maybeRef)
  ) {
    context.onError(
      createCompilerError(ErrorCodes.X_V_MODEL_MALFORMED_EXPRESSION, exp.loc)
    )
    return createTransformProps()
  }

  if (
    context.prefixIdentifiers &&
    isSimpleIdentifier(expString) &&
    context.identifiers[expString]
  ) {
    context.onError(
      createCompilerError(ErrorCodes.X_V_MODEL_ON_SCOPE_VARIABLE, exp.loc)
    )
    return createTransformProps()
  }

  const isInputElement = INPUT_TAGS.includes(node.tag)

  const propName = arg ? arg : createSimpleExpression('modelValue', true)
  let eventName = arg
    ? isStaticExp(arg)
      ? `onUpdate:${camelize(arg.content)}`
      : createCompoundExpression(['"onUpdate:" + ', arg])
    : `onUpdate:modelValue`

  if (isInputElement && eventName === 'onUpdate:modelValue') {
    eventName = getEventName(dir)
  }
  const eventType = isInputElement ? getEventParamsType(dir) : expType

  let eventValue = isInputElement ? `$event.detail.value` : `$event`

  if (withTrim(dir)) {
    eventValue = `${eventValue}.trim()`
  }
  if (withNumber(dir)) {
    eventValue = `looseToNumber(${eventValue})`
  }

  let assignmentExp: ExpressionNode
  const eventArg = eventType ? `($event: ${eventType})` : `$event`
  if (maybeRef) {
    if (bindingType === BindingTypes.SETUP_REF) {
      // v-model used on known ref.
      assignmentExp = createCompoundExpression([
        `${eventArg} => {(`,
        createSimpleExpression(rawExp, false, exp.loc),
        `).value = ${eventValue}}`,
      ])
    } else {
      // v-model used on a potentially ref binding in <script setup> inline mode.
      // the assignment needs to check whether the binding is actually a ref.
      const altAssignment =
        bindingType === BindingTypes.SETUP_LET
          ? `${rawExp} = ${eventValue}`
          : ``
      assignmentExp = createCompoundExpression([
        `${eventArg} => {if(${context.helperString(IS_REF)}(${rawExp})) { (`,
        createSimpleExpression(rawExp, false, exp.loc),
        `).value = ${eventValue} }${
          altAssignment ? ` else { ${altAssignment} }` : ``
        }}`,
      ])
    }
  } else {
    assignmentExp = createCompoundExpression([
      `${eventArg} => {(`,
      exp,
      `) = ${eventValue}}`,
    ])
  }

  const props = [
    // modelValue: foo
    createObjectProperty(propName, exp),
    // "onUpdate:modelValue": $event => (foo = $event)
    createObjectProperty(eventName, assignmentExp),
  ]

  // cache v-model handler if applicable (when it doesn't refer any scope vars)
  if (
    context.prefixIdentifiers &&
    !context.inVOnce &&
    context.cacheHandlers &&
    !hasScopeRef(exp, context.identifiers)
  ) {
    props[1].value = context.cache(props[1].value)
  }

  // modelModifiers: { foo: true, "bar-baz": true }
  if (dir.modifiers.length && node.tagType === ElementTypes.COMPONENT) {
    const modifiers = dir.modifiers
      .map((m) => (isSimpleIdentifier(m) ? m : JSON.stringify(m)) + `: true`)
      .join(`, `)
    const modifiersKey = arg
      ? isStaticExp(arg)
        ? `${arg.content}Modifiers`
        : createCompoundExpression([arg, ' + "Modifiers"'])
      : `modelModifiers`
    props.push(
      createObjectProperty(
        modifiersKey,
        createSimpleExpression(
          `{ ${modifiers} }`,
          false,
          dir.loc,
          ConstantTypes.CAN_HOIST
        )
      )
    )
  }

  return createTransformProps(props)
}

function createTransformProps(props: Property[] = []) {
  return { props }
}

function getEventName(dir: DirectiveNode): string {
  return withLazy(dir) ? 'onBlur' : 'onInput'
}

function getEventParamsType(dir: DirectiveNode): string {
  return withLazy(dir) ? 'InputBlurEvent' : 'InputEvent'
}

function withLazy(dir: DirectiveNode): boolean {
  return dir.modifiers.includes('lazy')
}

function withNumber(dir: DirectiveNode): boolean {
  return dir.modifiers.includes('number')
}

function withTrim(dir: DirectiveNode): boolean {
  return dir.modifiers.includes('trim')
}
