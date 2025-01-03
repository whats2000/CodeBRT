# CodeBRT

[English](README.md) | [繁體中文](README_zh-TW.md)

## 总览

**版本**：0.4.11

**状态**：_开发中_  
⚠️ 此项目目前处于Beta阶段。某些功能仍在开发中，您可能会遇到错误或未完成的功能。

**CodeBRT** 是一个由人工智能驱动的助手，旨在帮助用户完成代码相关的工作，从编写和分析代码到管理调度任务。该项目是免费的、开源的，并且对所有人开放。

**文档**：[CodeBRT 文档](https://whats2000.github.io/CodeBRT/zh-CN/)

### 主要功能

- **代码对话聊天**：与AI交互以讨论和理解代码。
- **代码调度任务**：管理和自动化代码任务。
- **代码补全**：获取代码建议和补全。
- **代码分析**：分析代码以改进、排除错误或优化。
- **语音助理**：通过语音指令和响应进行无需使用手的交互。
- **图像分析**：分析和理解与代码相关的图像等。

该项目利用 **VSCode 扩展 API** 以及各种 **语言模型 API**。

## 目录

- [总览](#总览)
- [安装](#安装)
- [使用](#使用)
- [路线图](#路线图)
- [贡献](#贡献)
- [建议或错误](#建议或错误)
- [参考资料](#参考资料)

## 安装

要安装和开始使用 CodeBRT，请遵循以下步骤：

- 使用 **VSCode 扩展**：
    1. 从[市场](https://marketplace.visualstudio.com/items?itemName=whats2000.code-brt)下载最新版本。
    2. 在 Visual Studio Code 中安装扩展。

- 进行**本地开发**：
    1. 将仓库克隆到本地机器。
       ```shell
       git clone https://github.com/whats2000/CodeBRT.git
       ```
    2. 对于主要扩展：
        - 在 VSCode 中打开 `VSCodeExtension/code-brt` 文件夹。
          ```shell
          cd VSCodeExtension/code-brt
          ```
        - 在终端中执行 `npm install` 安装依赖项。
          ```shell
          npm install
          ```
    3. 在 VSCode 中运行扩展。
        - 在 VSCode 中打开 `VSCodeExtension/code-brt` 文件夹。
        - 在 `运行和调试` 面板中运行扩展。

**注意：** 文档仍在建设中，功能可能尚未完全记录。

## 使用

安装后，可以在 Visual Studio Code 中访问 CodeBRT。主要功能包括：

- **与 AI 聊天**：使用聊天面板与 AI 进行代码相关的对话。
- **语音指令**：通过发出语音指令启动语音功能。

关于快速入门指南，请参考文档的[快速入门](https://whats2000.github.io/CodeBRT/zh-CN/docs/introduction)部分。

此外，还提供了外部插件以扩展项目的功能。在[此处](https://github.com/whats2000/CodeBRT/tree/main/ExternalPlugIn)探索可用的插件。

## 路线图

以下是 CodeBRT 即将推出的功能和改进概述：

### 版本 0.1

- [x] 初始项目设置
- [x] VSCode API 集成
- [x] 语言模型 API 集成
- [x] 基本代码对话聊天

### 版本 0.2

- [x] 历史记录自定义（标记和排序）
- [x] 自定义系统指令
- [x] 完整的语音输入和输出功能
- [x] 开源 GPT-SoVits 文本转语音集成

### 版本 0.3（正在进行中）

- [x] 优化历史记录渲染
- [x] Redux 用于更好的状态管理
- [ ] 编辑器内聊天进行代码生成
- [ ] 使用热键手动代码补全
    - [x] 触发代码补全
    - [ ] 上下文检索
- [x] 自动代码补全
- [x] 代码集成器以组合代码片段

### 版本 0.4（正在进行中）

- [ ] 工具调用功能
    - [x] 网络搜索
    - [x] URL 获取
    - [x] PDF 提取
    - [x] 读取文件
    - [x] 写入文件
    - [x] 搜索文件
    - [x] 列出文件使用上下文
    - [x] 执行代码
    - [x] 网站检查器
    - [x] 列出代码定义
    - [ ] 图像生成
    - [ ] 代码解释器
- [x] 显示代码补全后的文件差异
- [ ] 任务调度 <- **正在进行**
- [ ] 自动任务调度和完成
- [ ] 自动调试
- [ ] 本地高级数据分析
- [x] 繁体中文/简体中文本地化支持
- [ ] 模型上下文协议支持（MCP）<- **正在进行**
- [x] 在聊天中提及上下文

### 版本 1.0（稳定版本）

- [ ] 用于代码生成的架构模式
- [ ] 智能本地化支持（多语言 `.json` 生成器）
- [ ] 代码文档配对生成
- [ ] 代码实用程序测试生成
- [ ] 代码风格分析
- [ ] 改进早期版本的功能

### 后续版本
该项目将持续演进，增加新功能和改进。敬请关注更多更新！

## 贡献

我们欢迎贡献！无论您是修复错误、新增功能还是改进文档，您的帮助都是值得感谢的。

要贡献：

1. 在 GitHub 上分叉仓库。
2. 创建一个新的功能分支。
3. 进行您的更改并提交拉取请求。

更多信息，请访问 [GitHub 仓库](https://github.com/whats2000/CodeBRT)。

## 建议或错误

如果您有任何建议、功能请求或错误报告，请在 GitHub 仓库的[问题部分](https://github.com/whats2000/CodeBRT/issues)提交。我们重视您的反馈，并致力于根据社区意见改进项目。

## 参考资料

CodeBRT 建立在各种开源工具和框架之上。特别感谢以下：

- [VSCode 扩展的起始框架](https://github.com/sfc-gh-tkojima/vscode-react-webviews) by [sfc-gh-tkojima](https://github.com/sfc-gh-tkojima)
- [Continue 项目，用于 LLM 响应的处理](https://github.com/continuedev/continue/) by continuedev 团队（Apache 许可 2.0）
- [Cline 项目，用于基于代理的框架](https://github.com/clinebot/cline) by [saoudrizwan](https://github.com/saoudrizwan/)（Apache 许可 2.0）

- 来自 [SVG Repo](https://www.svgrepo.com/) 的图标和徽标：
    - [Vscode2 打开的 SVG 矢量](https://www.svgrepo.com/svg/373400/vscode2-opened)（MIT 许可）
    - [缩进 SVG 矢量](https://www.svgrepo.com/svg/532181/indent)（CC 署名授权）
    - [停止圆形 SVG 矢量](https://www.svgrepo.com/svg/361332/stop-circle)（MIT 许可）

---

**许可**：[GNU 通用公共许可](https://github.com/whats2000/CodeBRT/blob/main/LICENSE.md)
