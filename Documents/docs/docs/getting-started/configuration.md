# Configuration

This guide provides instructions on how to configure the **Model Service API Key** for the CodeBRT extension. You will learn how to access the settings, input your API key for various model services, and save your configuration.

## Table of Contents
- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Accessing the Configuration Panel](#accessing-the-configuration-panel)
- [Configuring the Model Service API Key](#configuring-the-model-service-api-key)
- [Additional Settings: Voice Service](#additional-settings-voice-service)
- [Troubleshooting](#troubleshooting)

---

## Overview

The **Model Service API Key** is necessary for connecting CodeBRT to external model services. You will configure the API key for the model service of your choice through the extension’s settings panel. Once configured, CodeBRT will authenticate your requests using the provided key. This section will walk you through the steps to obtain and configure the API key.

In the next section, we will cover how to use CodeBRT with the configured model services.

---

## Prerequisites

Before starting, make sure you have the following:
- A registered account with the model service provider you intend to use.
- CodeBRT extension installed in Visual Studio Code.
- Internet access to retrieve the API key and communicate with the model service.

---

## Accessing the Configuration Panel

To configure the API key, follow these steps:

1. Open **Visual Studio Code** and ensure the **CodeBRT** extension is installed.

2. **Open the chat board** on the left-hand side of VSCode (this is where CodeBRT's functionality lives).

3. If your device has a smaller screen and you do not immediately see the configuration button:
   - Click on the **gear button** on the chat board.
   - A dropdown menu will appear; select **General Settings** from this menu to open the configuration panel.

   ![](/img/getting-started/configuration/settings-dropdown.png)

---

## Configuring the Model Service API Key

CodeBRT supports multiple model services, allowing you to choose which service to connect to. Each service requires its own API key for authentication.

1. In the **General Settings** panel, locate the input field for the specific model service you want to configure.
   > **Note:** For new users, we recommend starting with the "Gemini" from Google which is free to use.

2. Next to the input field for the **Model Service API Key**, you’ll find a helpful link to guide you on where to obtain the API key for the selected service.

   ![](/img/getting-started/configuration/api-key-field-help-link.png)

3. Click the link and follow the steps to generate an API key from the service provider’s website.

   You can refer to the detailed steps below for generating the API key:

   ### Generating an API Key:
   - Log in to your account on the model service provider’s website.
   - Navigate to the **API Keys** section under your account settings.
   - Click **Generate New API Key**.
   - Copy the generated API key to your clipboard.

   > **Note:** Ensure your API key is kept secure and not shared publicly.

4. After you have the API key, return to the CodeBRT configuration panel and paste the API key into the correct input field corresponding to the model service you selected.

5. Once you have entered the API key, close the configuration panel to automatically save the changes.

> **Important:** Double-check that the key is correctly entered and there are no extra spaces before or after the key.

---

## Additional Settings: Voice Service

CodeBRT also supports voice functionality, which requires additional configuration.

You can find the settings and documentation for configuring the voice service in the following file:
- **[Voice Service Configuration Guide](/docs/features/voice-service/configuration.md)**

This guide will provide details on how to set up the voice service and manage its settings.

---

## Troubleshooting

If you encounter any issues during the configuration, refer to these troubleshooting steps:

- **Invalid API Key Error**: Ensure the API key was copied correctly and has not expired. You can regenerate a new API key if necessary.
- **Connection Issues**: Verify that you have an active internet connection and that the model service provider’s servers are accessible.
- **Error Messages**: Check the **CodeBRT Log** for detailed error messages that can help identify potential configuration mistakes.

For further assistance, please consult the official [CodeBRT Issues](https://github.com/whats2000/CodeBRT/issues) page for known issues or create a new issue for personalized support.

---

## Conclusion

You have now configured the Model Service API Key for CodeBRT. In the next section of the documentation, we will cover how to use CodeBRT with the configured model services to get the most out of the tool. Remember to check the documentation regularly for updates on new features and configuration options.
