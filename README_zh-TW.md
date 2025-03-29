# CodeBRT

[English](README.md) | [简体中文](README_zh-CN.md)

## 總覽

**版本**：0.4.13

**狀態**：_開發中_  
⚠️ 此專案目前處於Beta階段。某些功能仍在開發中，您可能會遇到錯誤或未完成的功能。

**CodeBRT** 是一個由人工智能驅動的助手，旨在幫助使用者完成程式碼相關的工作，從編寫和分析程式碼到管理排程任務。該專案是免費的、開源的，並且對所有人開放。

**說明文件**：[CodeBRT 文檔](https://whats2000.github.io/CodeBRT/zh-TW/)

### 主要功能

- **程式碼對話聊天**：與AI互動以討論和理解程式碼。
- **程式碼排程任務**：管理和自動化程式碼任務。
- **程式碼補全**：獲取程式碼建議和補全。
- **程式碼格式化**：自動格式化程式碼以遵守最佳實踐。
- **語音助理**：通過語音指令和回應進行無需使用手的交互。
- **圖像分析**：分析和理解與程式碼相關的圖像等。

該專案利用 **VSCode 擴展 API** 以及各種 **語言模型 API**。

## 目錄

- [總覽](#總覽)
- [安裝](#安裝)
- [使用](#使用)
- [路線圖](#路線圖)
- [貢獻](#貢獻)
- [建議或錯誤](#建議或錯誤)
- [參考資料](#參考資料)

## 安裝

要安裝和開始使用 CodeBRT，請遵循以下步驟：

- 使用 **VSCode 擴展**：
    1. 從[市集](https://marketplace.visualstudio.com/items?itemName=whats2000.code-brt)下載最新版本。
    2. 在 Visual Studio Code 中安裝擴展。

- 進行**本地開發**：
    1. 將儲存庫克隆到本地機器。
       ```shell
       git clone https://github.com/whats2000/CodeBRT.git
       ```
    2. 對於主要擴展：
        - 在 VSCode 中打開 `VSCodeExtension/code-brt` 資料夾。
          ```shell
          cd VSCodeExtension/code-brt
          ```
        - 在終端機中執行 `npm install` 安裝依賴項。
          ```shell
          npm install
          ```
    3. 在 VSCode 中運行擴展。
        - 在 VSCode 中打開 `VSCodeExtension/code-brt` 資料夾。
        - 在 `執行和除錯` 面板中運行擴展。

**注意：** 文檔仍在建設中，功能可能尚未完全記錄。

## 使用

安裝後，可以在 Visual Studio Code 中訪問 CodeBRT。主要功能包括：

- **與 AI 聊天**：使用聊天面板與 AI 進行程式碼相關的對話。
- **語音指令**：通過發出語音指令啟動語音功能。

關於快速入門指南，請參考文檔的[快速入門](https://whats2000.github.io/CodeBRT/zh-TW/docs/introduction)部分。

此外，還提供了外部外掛程式以擴展專案的功能。在[此處](https://github.com/whats2000/CodeBRT/tree/main/ExternalPlugIn)探索可用的外掛程式。

## 路線圖

以下是 CodeBRT 即將推出的功能和改進概述：

### 版本 0.1

- [x] 初始專案設置
- [x] VSCode API 整合
- [x] 語言模型 API 整合
- [x] 基本程式碼對話聊天

### 版本 0.2

- [x] 歷史記錄自訂（標記和排序）
- [x] 自訂系統指令
- [x] 完整的語音輸入和輸出功能
- [x] 開源 GPT-SoVits 文字轉語音整合

### 版本 0.3（正在進行中）

- [x] 優化歷史記錄渲染
- [x] Redux 用於更好的狀態管理
- [ ] 編輯器內聊天進行程式碼生成
- [ ] 使用熱鍵手動程式碼補全
    - [x] 觸發程式碼補全
    - [ ] 上下文檢索
- [x] 自動程式碼補全
- [x] 程式碼整合器以組合程式碼片段

### 版本 0.4（正在進行中）

- [ ] 工具呼叫功能
    - [x] 網路搜尋
    - [x] URL 獲取
    - [x] PDF 提取
    - [x] 讀取檔案
    - [x] 寫入檔案
    - [x] 搜尋檔案
    - [x] 列出檔案使用上下文
    - [x] 執行程式碼
    - [x] 網站檢查器
    - [x] 列出程式碼定義
    - [ ] 圖像生成
    - [ ] 程式碼解釋器
- [x] 顯示程式碼補全後的檔案差異
- [ ] 任務排程 <- **正在進行**
- [ ] 自動任務排程和完成
- [ ] 自動除錯
- [ ] 本地高級數據分析
- [x] 繁體中文/簡體中文本地化支持
- [ ] 模型上下文協議支持（MCP）<- **正在進行**
- [x] 在聊天中提及上下文

### 版本 1.0（穩定版本）

- [ ] 用於程式碼生成的架構模式
- [ ] 智能本地化支持（多語言 `.json` 生成器）
- [ ] 程式碼文檔配對生成
- [ ] 程式碼實用程式測試生成
- [ ] 程式碼風格分析
- [ ] 改進早期版本的功能

### 後續版本
該專案將持續演進，增加新功能和改進。敬請關注更多更新！

## 貢獻

我們歡迎貢獻！無論您是修復錯誤、新增功能還是改進文檔，您的幫助都是值得感謝的。

要貢獻：

1. 在 GitHub 上分叉儲存庫。
2. 創建一個新的功能分支。
3. 進行您的更改並提交拉取請求。

更多資訊，請訪問 [GitHub 儲存庫](https://github.com/whats2000/CodeBRT)。

## 建議或錯誤

如果您有任何建議、功能請求或錯誤報告，請在 GitHub 儲存庫的[問題部分](https://github.com/whats2000/CodeBRT/issues)提交。我們重視您的反饋，並致力於根據社群意見改善專案。

## 參考資料

CodeBRT 建立在各種開源工具和框架之上。特別感謝以下：

- [VSCode 擴展的起始框架](https://github.com/sfc-gh-tkojima/vscode-react-webviews) by [sfc-gh-tkojima](https://github.com/sfc-gh-tkojima)
- [Continue 專案，用於 LLM 回應的處理](https://github.com/continuedev/continue/) by continuedev 團隊（Apache 授權 2.0）
- [Cline 專案，用於基於代理的框架](https://github.com/clinebot/cline) by [saoudrizwan](https://github.com/saoudrizwan/)（Apache 授權 2.0）

- 來自 [SVG Repo](https://www.svgrepo.com/) 的圖示和標誌：
    - [Vscode2 打開的 SVG 向量](https://www.svgrepo.com/svg/373400/vscode2-opened)（MIT 授權）
    - [縮排 SVG 向量](https://www.svgrepo.com/svg/532181/indent)（CC 姓名標示授權）
    - [停止圓形 SVG 向量](https://www.svgrepo.com/svg/361332/stop-circle)（MIT 授權）

---

**授權**：[GNU 通用公共授權](https://github.com/whats2000/CodeBRT/blob/main/LICENSE.md)
