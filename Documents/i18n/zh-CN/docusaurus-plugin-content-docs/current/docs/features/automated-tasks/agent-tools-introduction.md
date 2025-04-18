# 代理工具介绍

## 概述
代理工具提供了一套全面的功能，可以与文件交互、执行命令、搜索内容以及执行与网络相关的任务。这些工具旨在帮助您高效地完成各种计算和信息收集任务。

## 可用工具

### 1. 网络和 URL 工具
#### webSearch
- **用途**：从网络获取最新信息
- **主要参数**：
    - `query`：搜索查询（必填）
    - `maxCharsPerPage`：每页字符限制（可选，默认值：6000）
    - `numResults`：搜索结果数量（可选，默认值：4）

#### urlFetcher
- **用途**：从特定 URL 提取内容
- **主要参数**：
    - `url`：要提取内容的 URL（必填）
    - `maxCharsPerPage`：提取的字符限制（可选，默认值：6000）

### 2. 文件管理工具
#### readFile
- **用途**：读取文件内容
- **主要参数**：
    - `relativeFilePath`：要读取的文件路径（必填）
- **特殊功能**：
    - 自动从 PDF 和 DOCX 文件中提取文本
    - 将原始内容作为字符串返回

#### writeToFile
- **用途**：将内容写入文件
- **主要参数**：
    - `relativePath`：文件将写入的路径（必填）
    - `content`：要写入的完整内容（必填）
- **特殊功能**：
    - 如果目录不存在，则创建目录
    - 覆盖现有文件

#### searchFiles
- **用途**：跨多个文件执行正则表达式搜索
- **主要参数**：
    - `relativePath`：要搜索的目录（必填）
    - `regex`：正则表达式模式（必填）
    - `filePattern`：可选的文件类型筛选器（例如：'*.ts'）

#### listFiles
- **用途**：列出指定路径中的文件和目录
- **主要参数**：
    - `relativePath`：要列出内容的路径（必填）
    - `recursive`：是否递归列出文件（可选）

### 3. 代码和开发工具
#### listCodeDefinitionNames
- **用途**：列出目录中的顶层代码定义
- **主要参数**：
    - `relativePath`：要分析的目录（必填）
- **见解**：
    - 显示顶层的类、函数和方法
    - 帮助理解代码结构和架构

### 4. 系统和命令工具
#### executeCommand
- **用途**：在系统上执行 CLI 命令
- **主要参数**：
    - `command`：要执行的 CLI 命令（必填）
    - `relativePath`：执行命令的可选目录
    - `timeoutDuration`：命令执行超时时间（默认值：10 秒）

### 5. 网络互动工具
#### inspectSite
- **用途**：捕获网站的初始状态
- **主要参数**：
    - `url`：要检查的网站 URL（必填）
- **功能**：
    - 截取完整页面屏幕截图
    - 捕获初始控制台日志
    - 在初始加载后不与页面互动

### 6. 互动工具
#### askFollowUpQuestion
- **用途**：从用户收集额外信息
- **主要参数**：
    - `question`：要询问的特定问题（必填）
- **使用情境**：澄清模糊之处或要求更多细节

#### attemptCompletion
- **用途**：呈现任务结果
- **主要参数**：
    - `result`：最终任务结果（必填）
    - `command`：用于演示结果的可选 CLI 命令

## 使用指南
1. 根据您的特定任务选择适当的工具
2. 仔细提供必要的参数
3. 以循序渐进的逻辑方式使用工具
4. 请注意文件路径和系统限制

## 最佳实践
- 使用 `relativePath` 维护上下文
- 在执行命令之前验证输入
- 妥善处理潜在错误
- 利用工具组合执行复杂任务

## 限制
- 有些工具具有字符或结果限制
- 依赖网络的工具可能会有连接问题
- 系统特定的命令可能无法在所有环境中运行

## 安全注意事项
始终验证命令和 URL，以防止意外操作或安全风险。