# 設定

本指南將引導您設定語音服務，其中包括文字轉語音和語音轉文字設定。以下列出每個服務的可用選項。

## 目錄
- [文字轉語音設定](#text-to-voice-configuration)
  - [OpenAI](#openai-text-to-voice-configuration)
  - [GPT-SoVits](#gpt-sovits-configuration)
- [語音轉文字設定](#voice-to-text-configuration)
  - [OpenAI](#openai-voice-to-text-configuration)
  - [Groq](#groq-configuration)
  - [VSCode 內建](#vscode-built-in-configuration)

---

## 文字轉語音設定

### OpenAI 文字轉語音設定

若要使用 OpenAI 進行文字轉語音轉換，您必須設定 OpenAI API 金鑰。

**請按照以下步驟設定 OpenAI：**

1. 取得您的 OpenAI API 金鑰。
2. 在一般設定中輸入您的 OpenAI API 金鑰。
3. 在您的應用程式中導覽至語音設定。
4. 在「**OpenAI 語音設定**」區段下，您可以變更語音類型。

   ![OpenAI-Voice-Selection](/img/voice-service/configuration/OpenAI-Voice-Selection.png)

:::note
有關如何存取設定面板的更詳細說明，請參閱 [設定面板存取指南](/docs/getting-started/configuration.md#configuring-the-model-service-api-key)。
:::

### GPT-SoVits 設定

本節概述如何設定 GPT-SoVits 連接埠，以及如何使用進階設定設定新語音。

#### 1. 確保已設定 GPT-SoVits 連接埠

首先，確保 GPT-SoVits 連接埠已在一般設定中正確設定。

![GPT-SoVits-port-setting](/img/voice-service/configuration/GPT-SoVits-port-setting.png)

您可以在 [GPT-SoVits 安裝](./installation.md#gpt-sovits-installation) 中找到有關如何建置和設定連接埠的說明

#### 2. 導覽至語音設定

設定連接埠後，請按照下列步驟執行：

1. 在應用程式中導覽至「**語音設定**」選單。
2. 找到並按一下「**GPT-SoVits 進階設定**」選項。

   ![GPT-SoVits-Advanced-Settings](/img/voice-service/configuration/GPT-SoVits-Advanced-Settings.png)

#### 3. 建立新語音

開啟「**GPT-SoVits 進階設定**」後，您可以透過提供以下詳細資訊來建立新的語音設定檔：

![voice-profile](/img/voice-service/configuration/voice-profile.png)

- **名稱**：稍後將在語音選取清單中顯示的名稱。
- **參考 WAV 路徑**：參考語音檔案的 `.wav` 格式路徑。此檔案將用於建立新語音模型。
- **參考文字**：參考 WAV 檔案中所說內容的轉錄。
- **提示語言**：參考 WAV 檔案中使用的語言（例如：英文、中文、日文等）。

:::tip
如果您的參考 WAV 檔案是中文，則轉錄將同時適用於中文和英文。
:::

填寫這些欄位後，儲存您的新語音設定檔。

#### 4. 設定語音

建立新語音後，請導覽回「**語音設定**」選單。在「**GPT-SoVits 語音設定**」區段下，從清單中選取新建立的語音，以便在您的操作中使用。
![GPT-SoVits-Voice-Selection](/img/voice-service/configuration/GPT-SoVits-Voice-Selection.png)

按照這些步驟執行，您將能夠正確設定 GPT-SoVits 並建立新的語音設定檔。

---

## 語音轉文字設定

### OpenAI 和 Groq 語音轉文字設定

**1. 檢查是否已安裝和設定 SoX**

執行 Groq 或 OpenAI 語音轉文字之前，
務必確保您的系統環境中已安裝並正確設定 SoX (Sound eXchange)。
您可以執行以下命令來驗證：
  ```bash
  sox --version
  ```

**2. 執行 Groq 或 OpenAI 語音轉文字服務**

安裝並正確設定 SoX 後，即可執行 Groq 或 OpenAI 音訊錄製。
如果 SoX 未正確設定，Groq 或 OpenAI 很可能會顯示與音訊處理相關的錯誤訊息。
如果您在 SoX 安裝期間或執行 Groq 或 OpenAI 時遇到任何錯誤，
並需要進一步協助，請先查看 [SoX 安裝](./installation.md#sox-installation)。

### VSCode 內建設定

若要使用 VSCode 內建功能進行語音轉文字，請按照下列步驟執行：

1. 開啟 VS Code。
2. 在 VS Code Marketplace 上導覽至 [VS Code Speech](https://marketplace.visualstudio.com/items?itemName=ms-vscode.vscode-speech) 擴充功能。
   ![vscode-speech-installation](/img/voice-service/configuration/vscode-speech-installation.png)
3. 按一下「安裝」按鈕來安裝擴充功能。
4. 安裝後，根據需要設定 VSCode 設定中的擴充功能。

:::note
請務必在安裝擴充功能後重新啟動 VS Code，以套用變更。
:::
