# 概述

完成 [安裝](./installation.md) 和 [設定](./configuration.md) 中概述的步驟後，語音服務即可在應用程式內使用。語音服務提供兩個主要功能：**文字轉語音** 和 **語音轉文字**。

## 文字轉語音
文字轉語音功能允許應用程式將聊天框中輸入的文字轉換為語音。

透過按下右上角的喇叭按鈕，應用程式將播放與聊天框中文字相對應的音訊。
![speaker-button](/img/voice-service/overview/speaker-button.png)

文字轉語音轉換有兩種可用方法：

- **OpenAI**：使用 OpenAI 的 API 來產生語音。
- **GPT-SoVits**：使用 GPT-SoVits 產生語音輸出。透過此服務，您可以使用本機音軌自訂語音範本。

## 語音轉文字
語音轉文字功能使應用程式能夠將口語轉錄為文字。錄音後，語音輸入將被處理並轉換為文字。

透過按下錄音機按鈕，應用程式開始錄製使用者的語音並將其轉換為文字。

![recorder-button](/img/voice-service/overview/recorder-button.png)

語音轉文字轉錄有三種可用方法：

- **OpenAI**：使用 OpenAI 的 API 進行語音轉文字轉換。
- **Groq**：使用 Groq 技術進行語音轉文字處理。（需要安裝 SoX）
- **VSCode 內建**：利用 VSCode 的內建功能來轉錄語音輸入。我們使用 VS Code Speech 進行轉換。

:::tip
該方法可以在 **語音設定** 中隨時變更。
:::