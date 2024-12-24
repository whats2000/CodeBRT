# 安裝

本指南將協助您設定在系統上使用語音服務所需的所有必要套件和工具。

## SoX 安裝

本指南提供有關如何在各種作業系統上安裝 **SoX (Sound eXchange)** 的說明。

### Windows

1. 從 [SoX 官方網站](http://sox.sourceforge.net/) 下載最新的 SoX 安裝程式。
2. 執行安裝程式，並按照螢幕上的指示完成安裝。
3. 安裝完成後，您需要將 SoX 安裝目錄新增至 `PATH` 環境變數，才能從任何命令列使用 `sox`。

#### 將 SoX 新增至 PATH：

本指南參考自 [如何在 Windows 10 上新增至 PATH 環境變數](https://www.architectryan.com/2018/03/17/add-to-the-path-on-windows-10/)。

1. 開啟「開始搜尋」，輸入「env」，然後選擇「編輯系統環境變數」：
2. 按一下「環境變數...」按鈕。
3. 在「系統變數」區段（下半部分）下，找到第一欄為「Path」的列，然後按一下「編輯」。
4. 將出現「編輯環境變數」UI。在此處，您可以按一下「新增」並輸入 SoX 安裝目錄路徑。

:::tip
SoX 的預設安裝路徑為 `C:\\Program Files (x86)\\sox-14-4-2`。
如果安裝目錄不同，請根據您的安裝目錄修改路徑。
:::

#### 驗證安裝：

- 新增至 `PATH` 後，開啟 **命令提示字元** 並執行：

  ```bash
  sox --version
  ```

### macOS

1. 開啟「終端機」。
2. 執行以下命令來安裝 SoX：
   ```bash
   brew install sox
   ```
3. 安裝完成後，執行以下命令來驗證安裝：
   ```bash
   sox --version
   ```
4. 如果出現版本資訊，則表示 SoX 已成功安裝。

### Linux

1. 開啟終端機。
2. 在 Linux 系統上安裝 SoX 的過程可能會因您使用的特定 Linux 發行版而異。以下是一些最常見的 Linux 發行版的說明。

   **執行以下命令來安裝 SoX：**

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

3. 安裝 SoX 後，您可以執行以下命令來驗證安裝：
   ```bash
   sox --version
   ```
4. 如果一切設定正確，它將顯示 SoX 的已安裝版本。

## GPT-SoVits 安裝

若要設定 GPT-SoVits 進行文字轉語音轉換，請按照下列步驟執行：

1. 前往 [GPT-SoVits GitHub 儲存庫](https://github.com/RVC-Boss/GPT-SoVITS)。
2. 從儲存庫下載壓縮資料夾。
3. 將壓縮資料夾解壓縮到您系統上的偏好位置。
4. 開啟命令提示字元 (CMD)。
5. 使用以下命令瀏覽至解壓縮的資料夾：
   ```bash
   cd path/to/extracted/folder
    ```
6. 在 CMD 中輸入以下命令以執行伺服器。
   ```bash
    .\\runtime\\python.exe .\\api.py
    ```
   或者，如果您使用 API v2，則可以使用以下命令執行伺服器：
   ```bash
    .\\runtime\\python.exe .\\api_v2.py
     ```
7. 執行指令碼後，複製 CMD 視窗中顯示的伺服器位址。
   ![server-run-address](/img/voice-service/installation/server-run-address.png)
8. 開啟您應用程式中的語音設定頁面。
9. 前往語音設定中的 GPT-SoVits 設定，並將複製的伺服器位址貼到「用戶端主機」欄位。
   ![server-host-field](/img/voice-service/installation/server-host-field.png)
:::note
API v1 的預設位址為 `http://127.0.0.1:9880/`

API v2 為 `http://127.0.0.1:9880/tts/`。

在使用 GPT-SoVits 時，請勿關閉 CMD 視窗，因為伺服器必須保持活動狀態才能使服務正常運作。
:::