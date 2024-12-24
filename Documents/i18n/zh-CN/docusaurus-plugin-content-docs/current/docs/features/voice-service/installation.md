# 安装

本指南将帮助您设置在系统上使用语音服务所需的所有必要软件包和工具。

## SoX 安装

本指南提供有关如何在各种操作系统上安装 **SoX (Sound eXchange)** 的说明。

### Windows

1. 从 [SoX 官方网站](http://sox.sourceforge.net/) 下载最新的 SoX 安装程序。
2. 运行安装程序，并按照屏幕上的指示完成安装。
3. 安装完成后，您需要将 SoX 安装目录添加到 `PATH` 环境变量，才能从任何命令行使用 `sox`。

#### 将 SoX 添加到 PATH：

本指南参考自 [如何在 Windows 10 上添加到 PATH 环境变量](https://www.architectryan.com/2018/03/17/add-to-the-path-on-windows-10/)。

1. 打开“开始搜索”，键入“env”，然后选择“编辑系统环境变量”：
2. 单击“环境变量...”按钮。
3. 在“系统变量”部分（下半部分）下，找到第一列为“Path”的行，然后单击“编辑”。
4. 将出现“编辑环境变量”UI。在此处，您可以单击“新建”并输入 SoX 安装目录路径。

:::tip
SoX 的默认安装路径为 `C:\\Program Files (x86)\\sox-14-4-2`。
如果安装目录不同，请根据您的安装目录修改路径。
:::

#### 验证安装：

- 添加到 `PATH` 后，打开 **命令提示符** 并运行：

  ```bash
  sox --version
  ```

### macOS

1. 打开“终端”。
2. 运行以下命令来安装 SoX：
   ```bash
   brew install sox
   ```
3. 安装完成后，运行以下命令来验证安装：
   ```bash
   sox --version
   ```
4. 如果出现版本信息，则表示 SoX 已成功安装。

### Linux

1. 打开终端。
2. 在 Linux 系统上安装 SoX 的过程可能会因您使用的特定 Linux 发行版而异。以下是一些最常见的 Linux 发行版的说明。

   **运行以下命令来安装 SoX：**

   - Ubuntu / Debian
     ```bash
     sudo apt-get update
     sudo apt-get install sox
     ```
   - Fedora
     ```bash
      sudo dnf install sox
     ```
   - Arch Linux
     ```bash
     sudo pacman -S sox
     ```
   - CentOS
     ```bash
     sudo yum install sox
     ```

3. 安装 SoX 后，您可以运行以下命令来验证安装：
   ```bash
   sox --version
   ```
4. 如果一切设置正确，它将显示 SoX 的已安装版本。

## GPT-SoVits 安装

要配置 GPT-SoVits 进行文本转语音转换，请按照下列步骤执行：

1. 前往 [GPT-SoVits GitHub 存储库](https://github.com/RVC-Boss/GPT-SoVITS)。
2. 从存储库下载压缩文件夹。
3. 将压缩文件夹解压缩到您系统上的首选位置。
4. 打开命令提示符 (CMD)。
5. 使用以下命令浏览至解压缩的文件夹：
   ```bash
   cd path/to/extracted/folder
    ```
6. 在 CMD 中输入以下命令以运行服务器。
   ```bash
    .\\runtime\\python.exe .\\api.py
    ```
   或者，如果您使用 API v2，则可以使用以下命令运行服务器：
   ```bash
    .\\runtime\\python.exe .\\api_v2.py
     ```
7. 执行脚本后，复制 CMD 窗口中显示的服务器地址。
   ![server-run-address](/img/voice-service/installation/server-run-address.png)
8. 打开您应用程序中的语音设置页面。
9. 前往语音设置中的 GPT-SoVits 设置，并将复制的服务器地址粘贴到“客户端主机”字段。
   ![server-host-field](/img/voice-service/installation/server-host-field.png)
:::note
API v1 的默认地址为 `http://127.0.0.1:9880/`

API v2 为 `http://127.0.0.1:9880/tts/`。

在使用 GPT-SoVits 时，请勿关闭 CMD 窗口，因为服务器必须保持活动状态才能使服务正常运行。
:::