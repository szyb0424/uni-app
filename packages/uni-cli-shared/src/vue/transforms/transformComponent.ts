import {
  createSimpleExpression,
  locStub,
  NodeTypes,
  RootNode,
  TemplateChildNode,
  TransformContext,
} from '@vue/compiler-core'
import { COMPONENT_BIND_LINK, COMPONENT_ON_LINK } from '../../mp/constants'
import { isUserComponent, createAttributeNode } from '../utils'

export function createTransformComponentLink(
  name: typeof COMPONENT_BIND_LINK | typeof COMPONENT_ON_LINK,
  type: NodeTypes.ATTRIBUTE | NodeTypes.DIRECTIVE = NodeTypes.DIRECTIVE
) {
  return function transformComponentLink(
    node: RootNode | TemplateChildNode,
    context: TransformContext
  ) {
    if (!isUserComponent(node, context)) {
      return
    }
    if (type === NodeTypes.DIRECTIVE) {
      node.props.push({
        type: NodeTypes.DIRECTIVE,
        name: 'on',
        modifiers: [],
        loc: locStub,
        arg: createSimpleExpression(name, true),
        exp: createSimpleExpression('__l', true),
      })
    } else {
      node.props.push(createAttributeNode(name, '__l'))
    }
  }
}
