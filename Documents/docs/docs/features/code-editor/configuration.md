# Configuration

In this section, we will guide you through the configuration of the code completion feature in the Code Editor.
The config can be set in the **Code Completion Settings** interface,
users can customize the behavior of the code completion feature.


The settings are divided into two categories:

## Manually Trigger Configuration

![ManualTriggerCodeCompletion-interface](/img/codeEditor/ManualTriggerCodeCompletion-interface.png)

To activate manual code completion, please press the **Enable Manual Trigger Code Completion** button.

Users can configure manual triggering with the following options:

- **Select Code Completion Model**  
  Choose the desired model (e.g., OpenAI) for generating code completions.

| ![Manual-CodeCompletion-ModelService](/img/codeEditor/ManualCodeCompletion-ModelService.png) | ![Manual-CodeCompletion-Model](/img/codeEditor/Manual-CodeCompletion-Model.png) |
|----------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------|

:::note
For more detailed instructions on how to Configuration the Model Service, please refer to the [Configuration Guide](/docs/docs/getting-started/configuration.md).
:::

- **Set Keybinding**  
  Define a keybinding to activate code completion.
  The default keybinding is `Ctrl + Shift + X` in Windows and Linux, and `Cmd + Shift + X` in macOS.
  This can be customized based on your preferences.

  ![EditKeybinding](/img/codeEditor/ManualCodeCompletion-EditKeybinding-button.png)

  ![Keybinding-Setting](/img/codeEditor/ManualCodeCompletion-Keybinding-Setting.png)

---

## Auto Trigger Configuration

Auto-trigger settings provide seamless, on-the-fly code suggestions. Details include:

![AutoTriggerConfiguration-interface](/img/codeEditor/AutoTriggerConfiguration-interface.png)

To activate manual code completion, please press the **Enable Auto Trigger Code Completion** button.

- **Supported Model**  
  Currently, only the **Ollama model** is available for auto-triggered completions.
  We currently support the following models for hole-filling code completions:
    - **Stable Code**
    - **Qwen2.5-Coder**
    - **Codestral**
    - **CodeLlama**
    - **DeepSeek-Coder**
    - **StarCoder**
    - 

:::tip
For more detailed instructions on how to download and Configuration the Ollama Model Service, please refer to the [Ollama website](https://ollama.com/).
:::

After download Ollama Model, please set your Ollama service localhost in Setting Bar.

![Ollama-host-setting](/img/codeEditor/Ollama-host-setting.png)

- **Enable Auto-Trigger**  
  Similar to manual code completion, this feature can be enabled or disabled based on your preferences.

:::note
Ensure that the Ollama service is running with the correct model before enabling the auto-trigger feature.
:::
