interface Resources {
  "common": {
    "previous": "Previous",
    "next": "Next",
    "finish": "Finish",
    "disable": "Disable {{tool}}",
    "enable": "Enable {{tool}}",
    "activate": "Activate {{tool}}",
    "tools": "Tools",
    "webSearch": "Web Search",
    "urlFetcher": "URL Fetcher",
    "agentTools": "Agent Tools",
    "modelAdvanceSettings": "Model Advance Settings",
    "learnMore": "Learn More",
    "closeAndSave": "Close and Save",
    "showActions": "Show Actions",
    "notSet": "Not Set",
    "voice": "Voice",
    "github": "GitHub",
    "load": "Load",
    "save": "Save",
    "setDefault": "Set Default",
    "toolBar": {
      "generalSettings": "General Settings",
      "voiceSettings": "Voice Settings",
      "codeCompletionSettings": "Code Completion Settings",
      "quickGuide": "Quick Start Guide",
      "whatsNew": "What's New",
      "history": "History",
      "newChat": "New Chat",
      "marketplace": "marketplace"
    },
    "floatButton": {
      "syncDescription": "Synchronize the file changes to chat history"
    },
    "settingsBar": {
      "settingsBarTitle": "Settings Bar",
      "settingsReloadRequired": "Some settings require a reload to take effect",
      "apiKeySettings": "API Key Settings",
      "hostServerSettings": "Host Server Settings",
      "themeAndCustomize": "Theme and Customize",
      "otherSettings": "Other Settings",
      "themePrimaryColor": "Theme Primary Color",
      "themeAlgorithm": "Theme Algorithm",
      "themeBorderRadius": "Theme Border Radius",
      "lightTheme": "Light",
      "darkTheme": "Dark",
      "compactTheme": "Compact",
      "doubleEnterSendMessagesLabel": "Send messages with double enter",
      "doubleEnterSendMessagesDescription": "Send messages with double enter",
      "keepLoadedContextLabel": "Keep the loaded context",
      "keepLoadedContextDescription": "Costs more RAM but allows faster loading",
      "apiKeyLinkTooltip": "Link to the API key page",
      "downloadLinkTooltip": "Link to the download page",
      "getApiKey": "Get API Key",
      "free": "Free",
      "supportsOffline": "Supports Offline",
      "resetTheme": "Reset Theme"
    },
    "historySidebar": {
      "chatHistoryTitle": "Chat History",
      "hideFilter": "Hide Filter",
      "showFilter": "Show Filter",
      "nothingCurrently": "Nothing Currently",
      "filterByTags": "Filter by tags",
      "today": "Today",
      "yesterday": "Yesterday",
      "last7Days": "Last 7 Days",
      "last1Month": "Last 1 Month",
      "earlier": "Earlier"
    },
    "voiceSettingsBar": {
      "title": "Voice Settings",
      "voiceServicesConfig": "Voice Services Configuration",
      "textToVoiceService": "Text To Voice Service",
      "voiceToTextService": "Voice To Text Service",
      "clickToShowMoreInfo": "Click to show more information",
      "vscodeSpeechExtensionNotice": "Run on local CPU. It will open an temporary text file and close after input is done (Auto Closure after silence). Sorry for but this must be done to use the built-in voice service, if you have any better idea please let us know! This relies on the built-in voice to text service in VSCode. If you have not installed it, you can do so by <marketplace />.",
      "sox": "SoX",
      "alsa": "ALSA",
      "microphoneAccessNotice": "Notice: This will require microphone access with <sox /> installed on Windows/Mac or <alsa /> on Linux. This is required as we use shell for recording audio. (If you have a better way, please suggest on <github />)",
      "openAIVoiceConfig": "OpenAI Voice Configuration",
      "openAIVoiceLabel": "(OpenAI)",
      "openAIPreviewVoices": "Preview voices at OpenAI website",
      "selectVoice": "Select a voice",
      "gptSoVitsVoiceConfig": "GPT-SoVits Voice Configuration",
      "gptSoVitsVoiceLabel": "(GPT-SoVits)",
      "gptSoVitsLearnMore": "Find out more about how to set up GPT-SoVits model locally",
      "selectReferenceVoice": "Select a reference voice",
      "gptSoVitsAdvanceSettings": "GPT-SoVits Advance Settings"
    },
    "GptSoVitsSettingsBar": {
      "title": "GPT-SoVits Settings",
      "clientHostLabel": "Client Host",
      "clientHostExample": "(e.g. http://127.0.0.1:9880/)",
      "clientHostNote": "Note: If you are using the old API V1, the default host is http://127.0.0.1:9880/, for V2, the default host is http://127.0.0.1:9880/tts/",
      "selectedReferenceVoiceLabel": "Selected Reference Voice",
      "selectReferenceVoicePlaceholder": "Select a reference voice",
      "referenceVoicesLabel": "Reference Voices",
      "addVoiceButton": "Add Voice",
      "note": "Note: Chinese also support English content above GPT-SoVITS-beta0706 version."
    },
    "gptSoVitsSettingsBarSortableItem": {
      "newVoice": "New Voice",
      "nameLabel": "Name",
      "referWavPathLabel": "Refer WAV Path",
      "referTextLabel": "Refer Text",
      "promptLanguageLabel": "Prompt Language",
      "englishLabel": "English",
      "chineseLabel": "Chinese",
      "japaneseLabel": "Japanese"
    },
    "codeCompletionSettingsBar": {
      "title": "Code Completion Settings",
      "manualConfig": "Manually Trigger Configuration",
      "manualTriggerLabel": "Manual Trigger Code Completion",
      "showMoreInfoTooltip": "Click to show more information",
      "enableManualTrigger": "Enable Manual Trigger Code Completion",
      "manualModelServiceLabel": "Model Service for Manual Code Completion",
      "manualModelLabel": "Model for Manual Code Completion",
      "editKeybinding": "Edit Keybinding",
      "manualDescription": "This will use more context, resources and token to provide higher quality completions.",
      "autoConfig": "Auto Trigger Configuration",
      "autoTriggerLabel": "Auto Trigger Code Completion",
      "enableAutoTrigger": "Enable Auto Trigger Code Completion",
      "autoModelServiceLabel": "Model Service for Auto Code Completion",
      "ollamaTooltip": "Currently only support ollama",
      "autoModelLabel": "Model for Auto Code Completion",
      "autoModelTooltip": "We currently support the model which are in <supportModels /> fill hole model template. Please help us to add more model in GitHub if you interested.",
      "autoDescription": "This will use when you typing pause for a moment. Which mean will faster suit for simple code snippet."
    },
    "modelAdvanceSettingBar": {
      "descriptions": {
        "systemPrompt": "The system prompt for the model. This can be used to introduce context to the model, such as a description of the conversation so far. Or, you can make the model more professional or casual by changing the prompt.",
        "maxTokens": "The maximum number of tokens that can be generated in the chat completion. The total length of input tokens and generated tokens is limited by the model's context length. What is token? Tokens are words, character sets, or combinations of words and punctuation that are used by large language models (LLMs) to decompose text into.",
        "temperature": "What sampling temperature to use, between 0 and 2. Higher values like 0.8 will make the output more random, while lower values like 0.2 will make it more focused and deterministic. We generally recommend altering this or `top_p` or `top_k` but not more than one.",
        "topP": "An alternative to sampling with temperature, called nucleus sampling, where the model considers the results of the tokens with top_p probability mass. So 0.1 means only the tokens comprising the top 10% probability mass are considered. We generally recommend altering this or `temperature` or `top_k` but not more than one.",
        "topK": "An alternative to sampling with temperature, called top-k sampling, where the model considers the results of the top k most likely tokens. So 2 means that only the top 2 most likely tokens are considered. We generally recommend altering this or `temperature` or `top_p` but not more than one.",
        "presencePenalty": "Number between -2.0 and 2.0. Positive values penalize new tokens based on whether they appear in the text so far, increasing the model's likelihood to talk about new topics.",
        "frequencyPenalty": "Number between -2.0 and 2.0. Positive values penalize new tokens based on their existing frequency in the text so far, decreasing the model's likelihood to repeat the same line verbatim.",
        "stop": "A list of tokens where the model should stop generating further tokens. Separate each token with a new line for multiple tokens. If you want to stop the model from generating more tokens, you can add a stop token here."
      },
      "notes": {
        "topK": "Some models may not support top-k sampling."
      }
    }
  },
  "userGuildTours": {
    "welcomeMessage": {
      "title": "Welcome to CodeBRT",
      "description": "This is a quick tour to help you get started with CodeBRT."
    },
    "uploadFiles": {
      "title": "Upload Files",
      "description": "Upload images. (Multiple images are supported)"
    },
    "recordVoice": {
      "title": "Record Voice",
      "description": "Record your voice. And convert it to text."
    },
    "textInput": {
      "title": "textInput",
      "description": "Write your message or Paste images from clipboard. You can also drag and drop images with Shift key pressed (Required by VSCode)"
    },
    "activateTools": {
      "title": "Activate Tools",
      "description": "This can toggle to let the large language model to perform various tasks. Such as web search, URL fetching, and control your IDE with agent tools. Enable the tools you need to use. Note: There are some models do not support tools."
    },
    "advanceSettings": {
      "title": "Advance Settings of the Model",
      "description": "Here contain System Prompt, Temperature, Max Tokens and more."
    },
    "fileSynchronization": {
      "title": "File Synchronization To History",
      "description": "To prevent the model overwrite human edited content. This feature will synchronize current file status to history. Use after manually editing the file."
    },
    "serviceProvider": {
      "title": "Service Provider",
      "description": "We support multiple model services. You can switch the provider here."
    },
    "modelList": {
      "title": "Model List",
      "description": "There is an edit model list button at the end of the model list. Which can let you edit or update the model list for the latest models."
    },
    "settings": {
      "title": "Settings",
      "description": "Before you start, you should set up the API key or Host the server. Check the 'General Settings' first for get the API key or setup for the local server."
    }
  }
}

export default Resources;
