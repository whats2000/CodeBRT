

This guide will help you set up all the necessary packages and tools required to use Voice Service on your system.

## GPT-SoVits installation

To configure GPT-SoVits for Text-to-Voice conversion, follow these steps:

1. Go to the [GPT-SoVits GitHub repository](https://github.com/RVC-Boss/GPT-SoVITS).
2. Download the zipped folder from the repository.
3. Extract the zipped folder to a preferred location on your system.
4. Open Command Prompt (CMD).
5. Use the following command to navigate to the extracted folder:
   ```bash
   cd path/to/extracted/folder
6. Enter the following command to CMD to run the server.
   ```bash
   runtime\python.exe api.py
7. Once the script runs, copy the server address displayed in the CMD window.
![server-run-address](/img/voice-service/installation/server-run-address.png)
8. Open the voice settings page in your application.
9. Go to the GPT-SoVits settings in the voice setting and paste the copied server address into the "Client Host" field.
![server-host-field](/img/voice-service/installation/server-host-field.png)  

   :::note
   Do not close the CMD window while using GPT-SoVits, as the server must remain active for the service to function.
   :::