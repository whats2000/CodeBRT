
After completing the steps outlined in [installation](./installation.md) and [configuration](./configuration.md), the voice service will be ready for use within the application.   The voice service provides two key functionalities: **Text to Voice** and **Voice to Text**.

## Text to Voice
The Text to Voice capability allows the app to convert the text entered the chat box into speech.  

By pressing the speaker button on the right-upper corner, the application will play the audio corresponding to the words in the chatbox.   
![speaker-button](/img/voice-service/overview/speaker-button.png)  

And there are two methods available for Text to Voice conversion:

- **OpenAI**: Uses OpenAI’s API to generate the voice.
- **GPT-SoVits**: Uses GPT-SoVits for generating voice output. With this service, you can use local audio tracks to customize voice templates.

## Voice to Text
The Voice to Text functionality enables the application to transcribe spoken words into text. After recording, the voice input will be processed and converted into text.  

By pressing the recorder button, the application starts recording the user's voice and convert it into text.  

![recorder-button](/img/voice-service/overview/recorder-button.png) 

And there are three available methods for Voice to Text transcription:

- **OpenAI**: Utilizes OpenAI’s API for speech-to-text conversion.
- **Groq**: Uses Groq technology for voice-to-text processing.(Need to install SoX)
- **VSCode Built-In**: Leverages the built-in capabilities of VSCode for transcribing voice inputs. We use VS Code Speech to convert.

:::tip
The method can be changed in the **Voice Setting** in anytime. 
:::
