# 程式碼補全

CodeBRT 提供程式碼補全功能，旨在提高編碼效率和準確性。
本文檔概述如何有效設定和使用程式碼補全設定。

## 用法

### 手動觸發設定

此功能是一種進階程式碼補全工具，允許使用者手動觸發程式碼建議。
與自動觸發的程式碼補全功能相比，它會消耗更多點數。
但它能提供更準確的建議，並能夠產生更複雜的程式碼補全。

- **用法**
  在編碼時，按下定義的快捷鍵即可立即觸發程式碼建議。並按下「TAB」鍵使用建議。

  ![ManualCodeCompletion-demo](/img/codeEditor/ManualCodeCompletion-demo.gif)

### 自動觸發設定

此功能在輸入時提供快速且無縫的程式碼建議。
在輸入時，程式碼補全功能會根據上下文自動建議程式碼補全。
我們使用填空模型來提供具有高效建議的程式碼補全。

- **用法**
  在輸入時，程式碼補全功能會根據上下文自動建議程式碼補全。
  使用「TAB」鍵使用建議。

  ![AutoCodeCompletion-demo](/img/codeEditor/AutoTriggerConfiguration-demo.gif)

## 狀態列

程式碼編輯器的底部有一個狀態列，顯示程式碼補全功能的當前狀態。

- **狀態**
  狀態列顯示程式碼補全功能的當前狀態。
  它將顯示程式碼補全功能是否正在處理中或可以使用。
    - **就緒**
  
      ![CodeCompletion-Status](/img/codeEditor/CodeCompletion-Status.png)
    - **處理中**
  
      ![CodeCompletion-Status-Processing](/img/codeEditor/CodeCompletion-Status-Processing.png)