# 配置

在本节中，我们将引导您配置代码编辑器中的代码补全功能。
配置可以在“代码补全设置”界面中设置，
用户可以自定义代码补全功能的行为。

设置分为两个类别：

## 手动触发配置

![ManualTriggerCodeCompletion-interface](/img/codeEditor/ManualTriggerCodeCompletion-interface.png)

要激活手动代码补全，请按下“启用手动触发代码补全”按钮。

用户可以使用以下选项配置手动触发：

- **选择代码补全模型**
  选择用于生成代码补全的所需模型（例如：OpenAI）。

| ![Manual-CodeCompletion-ModelService](/img/codeEditor/ManualCodeCompletion-ModelService.png) | ![Manual-CodeCompletion-Model](/img/codeEditor/Manual-CodeCompletion-Model.png) |
|----------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------|

:::note
有关如何配置模型服务的更详细说明，请参阅 [配置指南](/docs/getting-started/configuration.md)。
:::

- **设置快捷键**
  定义用于激活代码补全的快捷键。
  默认快捷键在 Windows 和 Linux 中为 `Ctrl + Shift + X`，在 macOS 中为 `Cmd + Shift + X`。
  您可以根据自己的偏好自定义此设置。

  ![EditKeybinding](/img/codeEditor/ManualCodeCompletion-EditKeybinding-button.png)

  ![Keybinding-Setting](/img/codeEditor/ManualCodeCompletion-Keybinding-Setting.png)

---

## 自动触发配置

自动触发设置提供无缝的即时代码建议。详细信息包括：

![AutoTriggerConfiguration-interface](/img/codeEditor/AutoTriggerConfiguration-interface.png)

要激活手动代码补全，请按下“启用自动触发代码补全”按钮。

- **支持的模型**
  目前，只有 **Ollama 模型** 可用于自动触发补全。
  我们目前支持以下用于填空代码补全的模型：
    - **Stable Code**
    - **Qwen2.5-Coder**
    - **Codestral**
    - **CodeLlama**
    - **DeepSeek-Coder**
    - **StarCoder**

:::tip
有关如何下载和配置 Ollama 模型服务的更详细说明，请参阅 [Ollama 网站](https://ollama.com/)。
:::

下载 Ollama 模型后，请在设置栏中设置您的 Ollama 服务 localhost。

![Ollama-host-setting](/img/codeEditor/Ollama-host-setting.png)

- **启用自动触发**
  与手动代码补全类似，此功能可以根据您的偏好启用或禁用。

:::note
请确保在启用自动触发功能之前，Ollama 服务已使用正确的模型运行。
:::
