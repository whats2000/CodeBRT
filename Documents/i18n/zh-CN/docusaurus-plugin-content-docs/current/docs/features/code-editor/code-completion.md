# 代码补全

CodeBRT 提供代码补全功能，旨在提高编码效率和准确性。
本文档概述如何有效配置和使用代码补全设置。

## 用法

### 手动触发配置

此功能是一种高级代码补全工具，允许用户手动触发代码建议。
与自动触发的代码补全功能相比，它会消耗更多积分。
但它能提供更准确的建议，并能够生成更复杂的代码补全。

- **用法**
  在编码时，按下定义的快捷键即可立即触发代码建议。并按下“TAB”键使用建议。

  ![ManualCodeCompletion-demo](/img/codeEditor/ManualCodeCompletion-demo.gif)

### 自动触发配置

此功能在输入时提供快速且无缝的代码建议。
在输入时，代码补全功能会根据上下文自动建议代码补全。
我们使用填空模型来提供具有高效建议的代码补全。

- **用法**
  在输入时，代码补全功能会根据上下文自动建议代码补全。
  使用“TAB”键使用建议。

  ![AutoCodeCompletion-demo](/img/codeEditor/AutoTriggerConfiguration-demo.gif)

## 状态栏

代码编辑器的底部有一个状态栏，显示代码补全功能的当前状态。

- **状态**
  状态栏显示代码补全功能的当前状态。
  它将显示代码补全功能是否正在处理中或可以使用。
    - **就绪**
  
      ![CodeCompletion-Status](/img/codeEditor/CodeCompletion-Status.png)
    - **处理中**
  
      ![CodeCompletion-Status-Processing](/img/codeEditor/CodeCompletion-Status-Processing.png)