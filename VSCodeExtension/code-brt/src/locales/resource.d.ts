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
    "toolBar": {
      "generalSettings": "General Settings",
      "voiceSettings": "Voice Settings",
      "codeCompletionSettings": "Code Completion Settings",
      "quickGuide": "Quick Start Guide",
      "whatsNew": "What's New",
      "history": "History",
      "newChat": "New Chat"
    },
    "floatButton": {
      "syncDescription": "Synchronize the file changes to chat history"
    },
    "settingsBar": {
      "settingsBarTitle": "Settings Bar",
      "learnMore": "Learn More",
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
      "resetTheme": "Reset Theme",
      "closeAndSave": "Close and Save"
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
