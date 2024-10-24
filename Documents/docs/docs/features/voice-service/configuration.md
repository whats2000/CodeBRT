

This guide will walk you through configuring the voice service, which includes both Text-to-Voice and Voice-to-Text settings. The available options for each service are listed below.

## Table of Contents
- [Text-to-Voice Configuration](#text-to-voice-configuration)
  - [OpenAI](#openai-text-to-voice-configuration)
  - [GPT-SoVits](#gpt-sovits-configuration)
- [Voice-to-Text Configuration](#voice-to-text-configuration)
  - [OpenAI](#openai-voice-to-text-configuration)
  - [Groq](#groq-configuration)
  - [VSCode Built-In](#vscode-built-in-configuration)

---

## Text-to-Voice Configuration

### OpenAI Text-to-Voice Configuration

To use OpenAI for Text-to-Voice conversion, you must set the OpenAI API key.  

**Follow these steps to configure OpenAI:**

1. Obtain your OpenAI API key.
2. Enter your OpenAI API key in the General setting.
3. Navigate to the voice settings in your application.
4. Under the **OpenAI Voice Configuration** section, you can change the voice type.  

![OpenAI-Voice-Selection](/img/voice-service/configuration/OpenAI-Voice-Selection.png)  

For more detailed instructions on how to access the configuration panel, please refer to the [Configuration Panel Access Guide](docs/docs/getting-started/configuration.md#configuring-the-model-service-api-key).

### GPT-SoVits Configuration

This section outlines how to configure the GPT-SoVits port and set up a new voice using the advanced settings.

#### 1. Ensure GPT-SoVits Port is Set

First, ensure that the GPT-SoVits port is properly set in the general settings.  

![GPT-SoVits-port-setting](/img/voice-service/configuration/GPT-SoVits-port-setting.png)  

You can find instructions on how to build and configure the port in the [GPT-SoVits installation](./installation.md#gpt-sovits-installation)

#### 2. Navigate to Voice Settings

Once the port is set up, follow these steps:

1. Navigate to the **Voice Settings** menu in the application.
2. Locate and click on the **GPT-SoVits Advanced Settings** option.  

![GPT-SoVits-Advanced-Settings](/img/voice-service/configuration/GPT-SoVits-Advanced-Settings.png)

#### 3. Create a New Voice

After opening the **GPT-SoVits Advanced Settings**, you can create a new voice profile by providing the following details:  

![voice-profile](/img/voice-service/configuration/voice-profile.png)

- **Name**: The name which will be in the voice selection list later.
- **Refer WAV Path**: Path to the reference voice file in `.wav` format. This file will be used to model the new voice.
- **Refer Text**: A transcription of what is spoken in the reference WAV file.
- **Prompt Language**: The language spoken in the reference WAV file (e.g., English, Spanish, etc.).

After filling in these fields, save your new voice profile.

#### 4. Configure the Voice

Once the new voice is created, navigate back to the **Voice Settings** menu. Under the **GPT-SoVits Voice Configuration** section, select the newly created voice from the list to use it for your operations.  
![GPT-SoVits-Voice-Selection](/img/voice-service/configuration/GPT-SoVits-Voice-Selection.png)

By following these steps, you'll be able to properly configure GPT-SoVits and create a new voice profile.

--- 

## Voice-to-Text Configuration
### OpenAI Voice-to-Text Configuration
To configure OpenAI for Voice-to-Text, follow the same steps(1&2) as described for the [Text-to-Voice configuration](#openai-text-to-voice-configuration), ensuring that your **OpenAI API key is properly set** in the setting panel.

### Groq Configuration
**1. Check if SoX is Installed and Configured**

Before running Groq, it's essential to ensure that SoX (Sound eXchange) is already installed and properly configured in your system environment. you can verify it by running:
  ```bash
  sox --version
  ```  

**2. Running Groq voice-to-text service**

Once SoX is installed and properly configured, Groq can be executed. If SoX is not correctly set up, Groq will likely display an error message related to audio processing.  
If you encounter any errors during SoX installation or while running Groq, and need further assistance, please check [SoX installation](./installation.md#sox-installation) first.

### VSCode Built-In Configuration
To use VSCode Built-In for Voice-to-Text, follow these steps:

1. Open VS Code.
2. Navigate to the [VS Code Speech](https://marketplace.visualstudio.com/items?itemName=ms-vscode.vscode-speech) extension on the VS Code Marketplace.  
![vscode-speech-installation](/img/voice-service/configuration/vscode-speech-installation.png)
3. Install the extension by clicking on the "Install" button.
4. After installation, configure the extension within your VSCode settings as needed.