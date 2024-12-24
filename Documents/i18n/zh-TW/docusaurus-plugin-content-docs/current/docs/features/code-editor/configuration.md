# 設定

在本節中，我們將引導您設定程式碼編輯器中的程式碼補全功能。
設定可以在「程式碼補全設定」介面中設定，
使用者可以自訂程式碼補全功能的行為。

設定分為兩個類別：

## 手動觸發設定

![ManualTriggerCodeCompletion-interface](/img/codeEditor/ManualTriggerCodeCompletion-interface.png)

若要啟用手動程式碼補全，請按下「啟用手動觸發程式碼補全」按鈕。

使用者可以使用以下選項配置手動觸發：

- **選擇程式碼補全模型**
  選擇用於產生程式碼補全的所需模型（例如：OpenAI）。

| ![Manual-CodeCompletion-ModelService](/img/codeEditor/ManualCodeCompletion-ModelService.png) | ![Manual-CodeCompletion-Model](/img/codeEditor/Manual-CodeCompletion-Model.png) |
|----------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------|

:::note
有關如何設定模型服務的更詳細說明，請參閱 [設定指南](/docs/docs/getting-started/configuration.md)。
:::

- **設定快捷鍵**
  定義用於啟用程式碼補全的快捷鍵。
  預設快捷鍵在 Windows 和 Linux 中為 `Ctrl + Shift + X`，在 macOS 中為 `Cmd + Shift + X`。
  您可以根據自己的偏好自訂此設定。

  ![EditKeybinding](/img/codeEditor/ManualCodeCompletion-EditKeybinding-button.png)

  ![Keybinding-Setting](/img/codeEditor/ManualCodeCompletion-Keybinding-Setting.png)

---

## 自動觸發設定

自動觸發設定提供無縫的即時程式碼建議。詳細資訊包括：

![AutoTriggerConfiguration-interface](/img/codeEditor/AutoTriggerConfiguration-interface.png)

若要啟用手動程式碼補全，請按下「啟用自動觸發程式碼補全」按鈕。

- **支援的模型**
  目前，只有 **Ollama 模型** 可用於自動觸發補全。
  我們目前支援以下用於填空程式碼補全的模型：
    - **Stable Code**
    - **Qwen2.5-Coder**
    - **Codestral**
    - **CodeLlama**
    - **DeepSeek-Coder**
    - **StarCoder**

:::tip
有關如何下載和設定 Ollama 模型服務的更詳細說明，請參閱 [Ollama 網站](https://ollama.com/)。
:::

下載 Ollama 模型後，請在設定列中設定您的 Ollama 服務 localhost。

![Ollama-host-setting](/img/codeEditor/Ollama-host-setting.png)

- **啟用自動觸發**
  與手動程式碼補全類似，此功能可以根據您的偏好啟用或停用。

:::note
請確保在啟用自動觸發功能之前，Ollama 服務已使用正確的模型執行。
:::