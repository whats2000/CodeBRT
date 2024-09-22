![](/img/head.png)
***    
Before we start, check the all the [installation](\installation.md) and [configurations](\configuration.md) are well-done.

To start the extension, click the extension button to open the extension dialog.   
![](/img/extension-button.png)

And you'll find General Setting in the setting button on the upper right corner.   
![](/img/setting-button.png)

## Basic Setting
### General setting  
In general setting, you need to set the api key to ensure that your model can be used.
 
![](/img/apikey-setting.png) 
 
And then, you can set the page style by the Theme Primary color, Theme Algorithm and Theme Border Radius below, too.   

![](/img/theme-setting.png)

### Voice setting  
In the voice settings, we will set the TTS and STT service methods. Moreover, the voice types listed allow you to choose. (An OpenAI API key is required to use OpenAI's options, if not, try the GPT-SoVits service.)  
![](/img/voice-setting.png)

## Started to Chat
### Language Model Selection

![](/img/language-model-selection.png)  
  
**Service Selection**    
We provide many types of services for you to choose from, such as Gemini, OpenAI, Ollama...etc. You can view the list and click to change Services.

**Model selection**    
In every service, you can set the model as you want. For example, in Gemini service we can choose the default models or edit the model list and customize the model you want.

### Input
![](/img/input.png)   
  
**Send Message**  
You can use the input area below to enter a message. After confirming that the message is correct, click the input key on the right, or press the enter key on the keyboard twice to send the message.

**Upload picture**    
We offered the service for you to upload local picture files for language models to analyze.

**Upload audio**
We also offer a voice-to-text service where you can record their voice using the record button and the message will be displayed.

### Chat History 
![](/img/chat-history.png)  
You can add new individual chat pages, and check them in the chat history.
If you don’t need any page in the chat history, you can remove it by a click.
Also, you can check all of chats in chat history.  
***Chat history will only be saved when the workspace is open.***

## ChatBox Function
![](/img/chatbox.png)    
**Edit**  
You can edit the chat box message through the edit button. After saving the changes, the model will regenerate the response, and the old message will be retained. You can switch to view at any time.

**Voice service**   
If desired, you can use the audio service by clicking the speaker button, which is translated through the language model.

**Copy**  
Also, messages can be copied by the copy button.

**Regenerate**  
If you click the regenerate button, the system will regenerate a suitable response to the question using the currently selected model.

## Model Advanced Setting
In the model advanced settings, you can set a system prompt to help your questions be answered in a more ideal way.

### System Prompt
![](/img/system-prompt.png)        
The default system prompt is 'You are a helpful assistant.'
If you want to modify, just modify it directly in the modification area. If you close the Model Advanced Setting window, the prompt will be saved.


Moreover, you can set the required prompt parameters. If it cannot be referenced, the system will send you a message and automatically ignore it.

### Prompt List  
![](/img/prompt-list.png)   
You can use the Save button to save the prompt into the prompt list. By detail, you can set the prompt name, description and prompt content to increase the convenience of reuse.

When you click the load button, you can see the past saved prompts and can modify or delete them at any time.
![](/img/prompt-filter.png)   
In addition, the prompt filter can help you find the prompts you want to use faster, providing custom tags and used model tags for classification.
## Web Search & URL fetcher 
**Web Search**    
Provide function of web search, you can let models search data on Web.  

**URL fetcher**    
url fetcher information
