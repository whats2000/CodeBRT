# 概述

完成 [安装](./installation.md) 和 [配置](./configuration.md) 中概述的步骤后，语音服务即可在应用程序内使用。语音服务提供两个主要功能：**文本转语音** 和 **语音转文本**。

## 文本转语音
文本转语音功能允许应用程序将聊天框中输入的文本转换为语音。

通过按下右上角的扬声器按钮，应用程序将播放与聊天框中文字相对应的音频。
![speaker-button](/img/voice-service/overview/speaker-button.png)

文本转语音转换有两种可用方法：

- **OpenAI**：使用 OpenAI 的 API 来生成语音。
- **GPT-SoVits**：使用 GPT-SoVits 生成语音输出。通过此服务，您可以使用本地音轨自定义语音模板。

## 语音转文本
语音转文本功能使应用程序能够将口语转录为文本。录音后，语音输入将被处理并转换为文本。

通过按下录音机按钮，应用程序开始录制用户的语音并将其转换为文本。

![recorder-button](/img/voice-service/overview/recorder-button.png)

语音转文本转录有三种可用方法：

- **OpenAI**：使用 OpenAI 的 API 进行语音转文本转换。
- **Groq**：使用 Groq 技术进行语音转文本处理。（需要安装 SoX）
- **VSCode 内置**：利用 VSCode 的内置功能来转录语音输入。我们使用 VS Code Speech 进行转换。

:::tip
该方法可以在 **语音设置** 中随时更改。
:::