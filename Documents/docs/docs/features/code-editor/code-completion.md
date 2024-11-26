# Code Completion

CodeBRT offers a code completion feature designed to enhance coding efficiency and accuracy. This document outlines how to configure and use the Code Completion Settings effectively.

---

## Code Completion Settings

In the **Code Completion Settings** interface, users can customize the behavior of the code completion feature. The settings are divided into two categories:

### Manually Trigger Configuration

![ManualTriggerCodeCompletion-interface](/img/codeEditor/ManualTriggerCodeCompletion-interface.png)

To activate manual code completion, please press the **Enable Manual Trigger Code Completion** button.

Users can configure manual triggering with the following options:

- **Select Code Completion Model**  
  Choose the desired model (e.g., OpenAI) for generating code completions.
  
| ![Manual-CodeCompletion-ModelService](/img/codeEditor/ManualCodeCompletion-ModelService.png) | ![Manual-CodeCompletion-Model](/img/codeEditor/Manual-CodeCompletion-Model.png) |
|------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------|

:::note
For more detailed instructions on how to Configuration the Model Service, please refer to the [Configuration Guide](/docs/docs/getting-started/configuration.md).
:::

- **Set Keybinding**  
  Define a keybinding to activate code completion. The default keybinding is `Ctrl + Shift + X`, but users can customize this based on their preferences.

  ![EditKeybinding](/img/codeEditor/ManualCodeCompletion-EditKeybinding-button.png)

  ![Keybinding-Setting](/img/codeEditor/ManualCodeCompletion-Keybinding-Setting.png)

- **Usage**  
  While coding, press the defined keybinding to trigger code suggestions instantly. And press "TAB" to use the suggestions.

  ![ManualCodeCompletion-demo](/img/codeEditor/ManualCodeCompletion-demo.gif)
---

### Auto Trigger Configuration

Auto-trigger settings provide seamless, on-the-fly code suggestions. Details include:

  ![AutoTriggerConfiguration-interface](/img/codeEditor/AutoTriggerConfiguration-interface.png)

  To activate manual code completion, please press the **Enable Auto Trigger Code Completion** button.

- **Supported Model**  
  Currently, only the **Ollama model** is available for auto-triggered completions.
  We currently support the following models:
  - **Stable Code**
  - **Qwen2.5-Coder**
  - **Codestral**
  - **CodeLlama**
  - **DeepSeek-Coder**
  - **StarCoder**

:::note
For more detailed instructions on how to download and Configuration the Ollama Model Service, please refer to the [Ollama website](https://ollama.com/).
:::

  After download Ollama Model, please set your Ollama service localhost in Setting Bar.

  ![Ollama-host-setting](/img/codeEditor/Ollama-host-setting.png)

- **Enable Auto-Trigger**  
  Simply enable this feature, and code suggestions will automatically appear as you type.

  ![AutoTriggerConfiguration-demo](/img/codeEditor/AutoTriggerConfiguration-demo.gif)


