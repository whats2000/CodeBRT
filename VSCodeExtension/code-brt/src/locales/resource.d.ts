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
      "gptSoVitsLearnMore": "Find out more about set up GPT-SoVits client host",
      "selectReferenceVoice": "Select a reference voice",
      "gptSoVitsAdvanceSettings": "GPT-SoVits Advance Settings"
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
