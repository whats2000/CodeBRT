# 配置

本指南将引导您配置语音服务，其中包括文本转语音和语音转文本设置。以下列出每个服务的可用选项。

## 目录
- [文本转语音配置](#text-to-voice-configuration)
  - [OpenAI](#openai-text-to-voice-configuration)
  - [GPT-SoVits](#gpt-sovits-configuration)
- [语音转文本配置](#voice-to-text-configuration)
  - [OpenAI](#openai-voice-to-text-configuration)
  - [Groq](#groq-configuration)
  - [VSCode 内置](#vscode-built-in-configuration)

---

## 文本转语音配置

### OpenAI 文本转语音配置

要使用 OpenAI 进行文本转语音转换，您必须设置 OpenAI API 密钥。

**请按照以下步骤配置 OpenAI：**

1. 获取您的 OpenAI API 密钥。
2. 在常规设置中输入您的 OpenAI API 密钥。
3. 在您的应用程序中导航至语音设置。
4. 在“**OpenAI 语音配置**”部分下，您可以更改语音类型。

   ![OpenAI-Voice-Selection](/img/voice-service/configuration/OpenAI-Voice-Selection.png)

:::note
有关如何访问配置面板的更详细说明，请参阅 [配置面板访问指南](docs/docs/getting-started/configuration.md#configuring-the-model-service-api-key)。
:::

### GPT-SoVits 配置

本节概述如何配置 GPT-SoVits 端口，以及如何使用高级设置设置新语音。

#### 1. 确保 GPT-SoVits 端口已设置

首先，确保 GPT-SoVits 端口已在常规设置中正确设置。

![GPT-SoVits-port-setting](/img/voice-service/configuration/GPT-SoVits-port-setting.png)

您可以在 [GPT-SoVits 安装](./installation.md#gpt-sovits-installation) 中找到有关如何构建和配置端口的说明。

#### 2. 导航至语音设置

设置端口后，请按照下列步骤执行：

1. 在应用程序中导航至“**语音设置**”菜单。
2. 找到并单击“**GPT-SoVits 高级设置**”选项。

   ![GPT-SoVits-Advanced-Settings](/img/voice-service/configuration/GPT-SoVits-Advanced-Settings.png)

#### 3. 创建新语音

打开“**GPT-SoVits 高级设置**”后，您可以通过提供以下详细信息来创建新的语音配置文件：

![voice-profile](/img/voice-service/configuration/voice-profile.png)

- **名称**：稍后将在语音选择列表中显示的名称。
- **参考 WAV 路径**：参考语音文件的 `.wav` 格式路径。此文件将用于建模新语音。
- **参考文本**：参考 WAV 文件中所说内容的转录。
- **提示语言**：参考 WAV 文件中使用的语言（例如：英语、中文、日语等）。

:::tip
如果您的参考 WAV 文件是中文，则转录将同时适用于中文和英文。
:::

填写这些字段后，保存您的新语音配置文件。

#### 4. 配置语音

创建新语音后，请导航回“**语音设置**”菜单。在“**GPT-SoVits 语音配置**”部分下，从列表中选择新创建的语音，以便在您的操作中使用。
![GPT-SoVits-Voice-Selection](/img/voice-service/configuration/GPT-SoVits-Voice-Selection.png)

按照这些步骤操作，您将能够正确配置 GPT-SoVits 并创建新的语音配置文件。

---

## 语音转文本配置

### OpenAI 和 Groq 语音转文本配置

**1. 检查是否已安装和配置 SoX**

在运行 Groq 或 OpenAI 语音转文本之前，
务必确保您的系统环境中已安装并正确配置 SoX (Sound eXchange)。
您可以执行以下命令来验证：
  ```bash
  sox --version
  ```

**2. 运行 Groq 或 OpenAI 语音转文本服务**

安装并正确配置 SoX 后，即可执行 Groq 或 OpenAI 音频录制。
如果 SoX 未正确设置，Groq 或 OpenAI 很可能会显示与音频处理相关的错误消息。
如果您在 SoX 安装期间或运行 Groq 或 OpenAI 时遇到任何错误，
并需要进一步帮助，请先查看 [SoX 安装](./installation.md#sox-installation)。

### VSCode 内置配置

要使用 VSCode 内置功能进行语音转文本，请按照下列步骤执行：

1. 打开 VS Code。
2. 在 VS Code Marketplace 上导航至 [VS Code Speech](https://marketplace.visualstudio.com/items?itemName=ms-vscode.vscode-speech) 扩展。
   ![vscode-speech-installation](/img/voice-service/configuration/vscode-speech-installation.png)
3. 单击“安装”按钮来安装扩展。
4. 安装后，根据需要在 VSCode 设置中配置扩展。

:::note
请务必在安装扩展后重新启动 VS Code，以应用更改。
:::