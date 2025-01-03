---
id: faq
title: FAQ
---

## Frequently Asked Questions

This section answers common questions about the project's functionalities and usage, helping users resolve frequently encountered issues.

:::tip Create issue to help us improve
If you have any suggestions or feedback on this process, please create an issue on the [GitHub repository](https://github.com/whats2000/CodeBRT/issues) to help us improve the user experience.
:::

## Common Questions

- [Why do I need to configure the model service API key?](#why-do-i-need-to-configure-the-model-service-api-key)
- [Is the application free to use?](#is-the-application-free-to-use)
- [Why cannot we find the chat history when I open different workspace?](#why-cannot-we-find-the-chat-history-when-i-open-different-workspace)

## General Questions
### Why do I need to configure the model service API key?

API keys are required for authentication and authorization when connecting to model services. 
Each model service has its own API key, which is used to verify the user's identity and access permissions.

:::note
Currently, I cannot offer a shared API key for all model services, 
so you will need to configure the API key for each service you intend to use.
:::

### How do I obtain an API key for a model service?

To get an API key for a model service, you can just simply click the `Get API Key` link next to the input field for the specific model service you want to configure.

:::note
If the link is invalid, please let us know as fast as possible.
:::

### Is the application free to use?

Yes, the application is free to use.

:::note
As far as I maintain the project, I will keep it free to use and open-source.
:::

### Why cannot we find the chat history when I open different workspace?

We current use the workspace `.vscode` folder to store the chat history, so if you open a different workspace, you will not find the chat history.

:::note
Please let us know if you do need to share the chat history between different workspaces. 
I may consider adding a shared chat history feature.
:::

## Model Related Questions

### Why do we only allow local model service for auto-completion?

The auto-completion feature is based on the local model service, 
which is more secure and faster than the remote model service.
Also, it can run more frequently than the remote model service.
We also plan to apply LoRa tuning to the local model service to improve the auto-completion performance.

:::note
Otherwise, you will cost a lot of payment for the remote model service.
:::