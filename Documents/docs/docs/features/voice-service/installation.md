This guide will help you set up all the necessary packages and tools required to use Voice Service on your system.

## SoX Installation

This guide provides instructions on how to install **SoX (Sound eXchange)** on various operating systems.

### Windows

1. Download the latest SoX installer from the [SoX official website](http://sox.sourceforge.net/).
2. Run the installer and follow the on-screen instructions to complete the installation.
3. Once installed, you need to add the SoX installation directory to your `PATH` environment variable to use `sox` from
   any command line.

#### Adding SoX to PATH:

The guild is reference
from [How to Add to the Windows PATH Environment Variable](https://www.architectryan.com/2018/03/17/add-to-the-path-on-windows-10/).

1. Open the Start Search, type in “env”, and choose “Edit the system environment variables”:
2. Click the “Environment Variables…” button.
3. Under the “System Variables” section (the lower half), find the row with “Path” in the first column, and click edit.
4. The “Edit environment variable” UI will appear. Here, you can click “New” and type in the SoX installation directory
   path.

:::tip
The default installation path for SoX is `C:\Program Files (x86)\sox-14-4-2`.
Modify the path according to your installation directory if it differs.
:::

#### Verify Installation:

- After adding to the `PATH`, open **Command Prompt** and run:

  ```bash
  sox --version
  ```

### macOS

1. Open the Terminal.
2. Install SoX by running the following command:
   ```bash
   brew install sox
   ```
3. Once installation is complete, verify it by running:
   ```bash
   sox --version
   ```
4. If the version information appears, SoX is successfully installed.

### Linux

1. Open a terminal.
2. To install SoX on a Linux system, the process can vary depending on the specific
   Linux distribution you are using. Below are instructions for some of the most common
   Linux distributions.

   **Run the following commands to install SoX:**

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

3. Once SoX is installed, you can verify it by running:
   ```bash
   sox --version
   ```
4. If everything is set up correctly, it will display the installed version of SoX.

## GPT-SoVits installation

To configure GPT-SoVits for Text-to-Voice conversion, follow these steps:

1. Go to the [GPT-SoVits GitHub repository](https://github.com/RVC-Boss/GPT-SoVITS).
2. Download the zipped folder from the repository.
3. Extract the zipped folder to a preferred location on your system.
4. Open Command Prompt (CMD).
5. Use the following command to navigate to the extracted folder:
   ```bash
   cd path/to/extracted/folder
    ```
6. Enter the following command to CMD to run the server.
   ```bash
    .\runtime\python.exe .\api.py
    ```
   Or if you use API v2, you can run the server with the following command:
   ```bash
    .\runtime\python.exe .\api_v2.py
     ```
7. Once the script runs, copy the server address displayed in the CMD window.
   ![server-run-address](/img/voice-service/installation/server-run-address.png)
8. Open the voice settings page in your app.
9. Go to the GPT-SoVits settings in the voice setting and paste the copied server address into the "Client Host" field.
   ![server-host-field](/img/voice-service/installation/server-host-field.png)
:::note
The default address of API v1 is `http://127.0.0.1:9880/`

API v2 is `http://http://127.0.0.1:9880/tts/`.

Does not close the CMD window while using GPT-SoVits, as the server must remain active for the service to function.
:::
