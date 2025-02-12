import { UniNodeJSON } from '@dcloudio/uni-shared'
import '../../../../../style/webview.css'
import WebView from '../../../components/web-view'

import { UniComponent } from './UniComponent'

export class UniWebView extends UniComponent {
  constructor(
    id: number,
    parentNodeId: number,
    refNodeId: number,
    nodeJson: Partial<UniNodeJSON>
  ) {
    super(id, 'uni-web-view', WebView, parentNodeId, refNodeId, nodeJson)
  }
}
