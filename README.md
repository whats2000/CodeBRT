# CodeBRT

## Overview

**Version**: 0.4.4

**Status**: _Under Development_  
⚠️ This project is currently in the Beta phase. Some features are still being developed, and you may encounter bugs or
incomplete functionalities.

**CodeBRT** is an AI-powered assistant designed to help users with code-related tasks, from writing and analyzing code
to managing scheduling tasks. The project is free, open-source, and accessible for everyone.

### Key Features

- **Code Conversation Chat**: Interact with the AI to discuss and understand code.
- **Code Scheduling Tasks**: Manage and automate coding tasks.
- **Code Completion**: Get code suggestions and completions.
- **Code Analysis**: Analyze code for improvements, errors, or optimizations.
- **Code Formatting**: Automatically format code to adhere to best practices.
- **Voice Assistant**: Hands-free interaction through voice commands and responses.
- **Image Analysis**: Analyze and understand images for tasks related to code and more.

The project utilizes the **VSCode Extension API** along with various **Language Model APIs**.

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Usage](#usage)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [Suggestions or Bugs](#suggestions-or-bugs)
- [References](#references)

## Installation

To install and start using CodeBRT, follow these steps:

- For Use the **VSCode Extension**:
    1. Download the latest release from
       the [Marketplace](https://marketplace.visualstudio.com/items?itemName=whats2000.code-brt).
    2. Install the extension in Visual Studio Code.

- For **Local Development**:
    1. Clone the repository to your local machine.
       ```shell
       git clone https://github.com/whats2000/CodeBRT.git
       ```
    2. For main extension:
        - Open the `VSCodeExtension/code-brt` folder in VSCode.
          ```shell
          cd VSCodeExtension/code-brt
          ```
        - Install the dependencies by running `npm install` in the terminal.
          ```shell
          npm install
          ```
    3. Run the extension in VSCode.
        - Open the folder `VSCodeExtension/code-brt` in VSCode.
        - Run the extension at `Run and Debug` panel in VSCode.

**Note:** The documentation is still under construction, and features may not be fully documented.

## Usage

Once installed, CodeBRT can be accessed within Visual Studio Code. The key functionalities include:

- **Chat with the AI**: Use the chat panel to interact with the AI for code-related conversations.
- **Voice Commands**: Activate voice features by issuing voice commands.

For a quick start guide, refer to the [Quick Start](https://whats2000.github.io/CodeBRT/docs/introduction)
section of the documentation.

Additionally, external plugins are available to extend the project’s capabilities. Explore the available
plugins [here](https://github.com/whats2000/CodeBRT/tree/main/ExternalPlugIn).

## Roadmap

Here’s an outline of the upcoming features and improvements for CodeBRT:

### Version 0.1

- [x] Initial project setup
- [x] VSCode API integration
- [x] Language model API integration
- [x] Basic Code Conversation Chat

### Version 0.2

- [x] History customization (tagging and sorting)
- [x] Custom system instructions
- [x] Full voice input and output features
- [x] Open-source GPT-SoVits text-to-voice integration

### Version 0.3 (WIP)

- [x] Optimized history rendering
- [x] Redux for better state management
- [ ] In-editor chat for code generation
- [ ] Manual code completion with hotkeys
    - [x] Trigger code completion
    - [ ] Context retrieval
- [x] Auto code completion
- [ ] Code integrator to compose code snippets <- **In Progress**

### Version 0.4 (WIP)

- [ ] Tool Calling Feature
    - [x] Web Search
    - [x] URL Fetch
    - [x] PDF Extraction
    - [x] Read File
    - [x] Write File
    - [x] Search File
    - [x] List Files Usage Context
    - [x] Execute Code
    - [x] Website Inspector
    - [x] List Code Definitions
    - [ ] Image Generation
    - [ ] Code Interpreter
- [x] Show file difference after code completion
- [ ] Task Scheduling
- [ ] Auto task scheduling and completion
- [ ] Auto-debugging
- [ ] Local advanced data analysis
- [ ] Localization support for Traditional Chinese/Simplified Chinese

### Version 1.0 (Stable Release)

- [ ] Architecture Mode for code generation
- [ ] Smart localization support (multi-language `.json` generator)
- [ ] Code-document pairing generation
- [ ] Code utility test generation
- [ ] Code style analysis
- [ ] Improved features from earlier versions

### Later Versions
The project will continue to evolve with new features and improvements. Stay tuned for more updates!

## Contributing

We welcome contributions! Whether you're fixing bugs, adding features, or improving documentation, your help is
appreciated.

To contribute:

1. Fork the repository on GitHub.
2. Create a new feature branch.
3. Make your changes and submit a pull request.

For more information, please visit the [GitHub Repository](https://github.com/whats2000/CodeBRT).

## Suggestions or Bugs

If you have any suggestions, feature requests, or bug reports, please submit them in
the [Issues section](https://github.com/whats2000/CodeBRT/issues) of the GitHub repository. We value your feedback and
aim to improve the project based on community input.

## References

CodeBRT is built on various open-source tools and frameworks. Special thanks to the following:

- [The Starter Framework For VSCode Extension](https://github.com/sfc-gh-tkojima/vscode-react-webviews) by [sfc-gh-tkojima](https://github.com/sfc-gh-tkojima)
- [The Continue Project For the process of LLM responses](https://github.com/continuedev/continue/) by continuedev team (Apache License 2.0)
- [The Cline Project For the agent-based framework](https://github.com/clinebot/cline) by [saoudrizwan](https://github.com/saoudrizwan/) (Apache License 2.0)

- Icons and logos from [SVG Repo](https://www.svgrepo.com/):
    - [Vscode2 Opened SVG Vector](https://www.svgrepo.com/svg/373400/vscode2-opened) (MIT License)
    - [Indent SVG Vector](https://www.svgrepo.com/svg/532181/indent) (CC Attribution License)
    - [Stop Circle SVG Vector](https://www.svgrepo.com/svg/361332/stop-circle) (MIT License)

---

**License**: [GNU GENERAL PUBLIC](https://github.com/whats2000/CodeBRT/blob/main/LICENSE.md)

