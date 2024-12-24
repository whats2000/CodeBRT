# 概述

在开始之前，请确保所有[安装](./installation.md)和[配置](./configuration.md)步骤都已正确完成。

## 启动扩展

要开始使用 CodeBRT：

1. 单击左侧边栏上的**扩展按钮**，以打开 CodeBRT 对话框。
   ![扩展按钮](/img/getting-started/overview/extension-button.png)

2. 要访问常规设置，请单击对话框右上角的**齿轮按钮**。
   ![设置按钮](/img/getting-started/overview/setting-button.png)

在设置中，您可以配置 API 密钥、主题和语音设置，这些对于充分利用 CodeBRT 至关重要。

---

## 基本设置

### 常规设置

在**常规设置**中，您需要设置所选模型服务的 API 密钥，以确保可以正确访问模型。

有关如何为不同模型服务配置 API 密钥的说明，请参阅 [配置指南](./configuration.md)。

此外，您可以根据您的喜好调整**主题主色**、**主题算法**和**主题边框半径**，以自定义界面的外观。

![API 密钥设置](/img/getting-started/overview/apikey-setting.png)

![主题设置](/img/getting-started/overview/theme-setting.png)

:::tip
**主题算法**设置可让您为聊天界面选择不同的颜色主题，这会根据所选的主色自动调整。
:::

### 语音设置

**语音设置**可让您配置文本转语音（TTS）和语音转文本（STT）服务。您也可以从列表中选择所需的语音类型。

如果您使用的是 OpenAI 的语音选项，请确保您已配置 OpenAI API 密钥。如果没有，您可以选择 **GPT-SoVits** 服务进行语音处理。

有关配置语音服务的更多详细信息，请参阅 [语音服务配置指南](/docs/features/voice-service/configuration.md)。

![语音设置](/img/getting-started/overview/voice-setting.png)

---

## 开始聊天

### 语言模型选择
   ![语言模型选择](/img/getting-started/overview/language-model-selection.png)  
您可以从多个**模型服务**中选择，例如 Gemini、OpenAI、Ollama 等。CodeBRT 通过允许您轻松地在不同服务之间切换来提供弹性。

1. **服务选择**：从下拉菜单中选择您要使用的模型服务。

2. **模型选择**：选择服务后，请从可用的模型中选择，或自定义您自己的模型列表以满足您的需求。

### 发送消息

1. 使用聊天窗口底部的输入框输入您的消息。

2. 输入后，单击右侧的**发送按钮**或按 **Enter** 键以提交您的消息。
   ![输入区域](/img/getting-started/overview/input.png)

### 上传文件和语音输入

- **上传图片**：您可以使用**上传按钮**上传图片供语言模型分析。

- **上传音频**：您可以单击**录音按钮**来使用**语音转文本**功能来捕获您的声音，然后将其转录。

---

## 聊天历史记录

您可以在**聊天历史记录**中查看和管理您先前的对话：

- 添加新的聊天页面并在它们之间切换。
- 一键删除不必要的聊天页面。
- 只要工作区打开，所有聊天记录都会保存。

:::note
聊天历史记录仅在工作区打开时保存。
:::

![聊天历史记录](/img/getting-started/overview/chat-history.png)

---

## 聊天框功能

在聊天框内，您可以执行下列操作：

1. **编辑**：修改任何先前的消息。保存后，系统将重新生成响应，并保留旧消息以供参考。

2. **语音服务**：您可以单击**扬声器图标**来启动语音服务，让模型通过音频响应。

3. **复制**：使用**复制按钮**复制聊天消息。

4. **重新生成**：如果您想要针对查询生成新的响应，请单击**重新生成按钮**以提示模型生成新的输出。

![聊天框](/img/getting-started/overview/chatbox.png)

---

## 高级模型设置

在**模型高级设置**中，您可以通过设置**系统提示**或保存常用提示以供日后使用，来微调模型响应查询的方式。

### 系统提示

默认情况下，系统提示设置为：**“您是一位乐于助人的助理。”**  
您可以修改此设置以根据您的需求自定义响应。当您关闭设置窗口时，系统会自动保存任何修改。

![系统提示](/img/getting-started/overview/system-prompt.png)

### 提示列表

- 将自定义提示保存至**提示列表**。您可以为每个提示指定名称、描述和内容，以便更轻松地重复使用。
- 使用**提示筛选器**，依自定义标签或模型类型快速查找提示。

![提示列表](/img/getting-started/overview/prompt-list.png)
![提示筛选器](/img/getting-started/overview/prompt-filter.png)

---

## 工具

CodeBRT 提供多个额外的工具来增强您的体验，您可以在设置中打开或关闭这些功能：

1. **网络搜索**：CodeBRT 允许模型执行网络搜索，以从互联网检索实时数据。

2. **URL 提取器**：输入 URL，CodeBRT 将提取相关信息供模型分析。

![工具切换](/img/getting-started/overview/tools-toggle.png)

---

## 结论

本概述涵盖有效开始使用 CodeBRT 的基本步骤。如需每个功能的更多详细信息，请参阅 [功能](/docs/features/overview.md) 部分中提供的个别指南。

通过深入了解特定功能，例如高级提示设置、网络搜索功能和语音服务，探索 CodeBRT 的全部潜力。
