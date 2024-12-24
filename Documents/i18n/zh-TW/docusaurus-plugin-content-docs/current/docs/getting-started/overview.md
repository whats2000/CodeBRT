# 概述

在開始之前，請確保所有[安裝](./installation.md)和[設定](./configuration.md)步驟都已正確完成。

## 啟動擴充功能

若要開始使用 CodeBRT：

1. 按一下左側邊欄上的**擴充功能按鈕**，以開啟 CodeBRT 對話方塊。
   ![擴充功能按鈕](/img/getting-started/overview/extension-button.png)

2. 若要存取一般設定，請按一下對話方塊右上角的**齒輪按鈕**。
   ![設定按鈕](/img/getting-started/overview/setting-button.png)

在設定中，您可以設定 API 金鑰、主題和語音設定，這些對於充分利用 CodeBRT 至關重要。

---

## 基本設定

### 一般設定

在**一般設定**中，您需要設定所選模型服務的 API 金鑰，以確保可以正確存取模型。

如需有關如何為不同模型服務設定 API 金鑰的說明，請參閱 [設定指南](./configuration.md)。

此外，您可以根據您的喜好調整**主題主色**、**主題演算法**和**主題邊框半徑**，以自訂介面的外觀。

![API 金鑰設定](/img/getting-started/overview/apikey-setting.png)

![主題設定](/img/getting-started/overview/theme-setting.png)

:::tip
**主題演算法**設定可讓您為聊天介面選擇不同的色彩主題，這會根據所選的主色自動調整。
:::

### 語音設定

**語音設定**可讓您設定文字轉語音（TTS）和語音轉文字（STT）服務。您也可以從清單中選擇所需的語音類型。

如果您使用的是 OpenAI 的語音選項，請確保您已設定 OpenAI API 金鑰。如果沒有，您可以選擇 **GPT-SoVits** 服務進行語音處理。

如需有關設定語音服務的更多詳細資訊，請參閱 [語音服務設定指南](/docs/features/voice-service/configuration.md)。

![語音設定](/img/getting-started/overview/voice-setting.png)

---

## 開始聊天

### 語言模型選擇
   ![語言模型選擇](/img/getting-started/overview/language-model-selection.png)  
您可以從多個**模型服務**中選擇，例如 Gemini、OpenAI、Ollama 等。CodeBRT 透過允許您輕鬆地在不同服務之間切換來提供彈性。

1. **服務選擇**：從下拉式選單中選擇您要使用的模型服務。

2. **模型選擇**：選取服務後，請從可用的模型中選擇，或自訂您自己的模型清單以符合您的需求。

### 發送訊息

1. 使用聊天視窗底部的輸入方塊輸入您的訊息。

2. 輸入後，按一下右側的**發送按鈕**或按 **Enter** 鍵以提交您的訊息。
   ![輸入區域](/img/getting-started/overview/input.png)

### 上傳檔案和語音輸入

- **上傳圖片**：您可以使用**上傳按鈕**上傳圖片供語言模型分析。

- **上傳音訊**：您可以按一下**錄音按鈕**來使用**語音轉文字**功能來擷取您的聲音，然後將其轉錄。

---

## 聊天歷史記錄

您可以在**聊天歷史記錄**中檢視和管理您先前的對話：

- 新增新的聊天頁面並在它們之間切換。
- 一鍵移除不必要的聊天頁面。
- 只要工作區開啟，所有聊天記錄都會儲存。

:::note
聊天歷史記錄僅在工作區開啟時儲存。
:::

![聊天歷史記錄](/img/getting-started/overview/chat-history.png)

---

## 聊天框功能

在聊天框內，您可以執行下列動作：

1. **編輯**：修改任何先前的訊息。儲存後，系統將重新產生回應，並保留舊訊息以供參考。

2. **語音服務**：您可以按一下**喇叭圖示**來啟動語音服務，讓模型透過音訊回應。

3. **複製**：使用**複製按鈕**複製聊天訊息。

4. **重新產生**：如果您想要針對查詢產生新的回應，請按一下**重新產生按鈕**以提示模型產生新的輸出。

![聊天框](/img/getting-started/overview/chatbox.png)

---

## 進階模型設定

在**模型進階設定**中，您可以透過設定**系統提示**或儲存常用提示以供日後使用，來微調模型回應查詢的方式。

### 系統提示

預設情況下，系統提示設定為：**「您是一位樂於助人的助理。」**  
您可以修改此設定以根據您的需求自訂回應。當您關閉設定視窗時，系統會自動儲存任何修改。

![系統提示](/img/getting-started/overview/system-prompt.png)

### 提示清單

- 將自訂提示儲存至**提示清單**。您可以為每個提示指定名稱、描述和內容，以便更輕鬆地重複使用。
- 使用**提示篩選器**，依自訂標籤或模型類型快速尋找提示。

![提示清單](/img/getting-started/overview/prompt-list.png)
![提示篩選器](/img/getting-started/overview/prompt-filter.png)

---

## 工具

CodeBRT 提供數個額外的工具來增強您的體驗，您可以在設定中開啟或關閉這些功能：

1. **網路搜尋**：CodeBRT 允許模型執行網路搜尋，以從網際網路擷取即時資料。

2. **URL 擷取器**：輸入 URL，CodeBRT 將擷取相關資訊供模型分析。

![工具切換](/img/getting-started/overview/tools-toggle.png)

---

## 結論

本概述涵蓋有效開始使用 CodeBRT 的基本步驟。如需每個功能的更多詳細資訊，請參閱 [功能](/docs/features/overview.md) 區段中提供的個別指南。

透過深入瞭解特定功能，例如進階提示設定、網路搜尋功能和語音服務，探索 CodeBRT 的全部潛力。
