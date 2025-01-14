#ChatGPTUI
 
ChatGPTUI is a web-based chat application that integrates with OpenAI's GPT models. This application allows users to interact with an AI assistant, upload documents, and receive context-aware responses based on the uploaded content.

##Features
 

Chat Interface: Users can interact with the AI assistant through a user-friendly chat interface.
Document Upload: Users can upload documents (e.g., PDF, DOCX) to provide context for the AI assistant.
Theming: Toggle between dark and light themes.
Customizable Settings: Adjust settings like max tokens, top P, temperature, and the number of past messages to include.
Code Block Handling: Display code blocks with syntax highlighting and a copy button.
Multi-line Input: The input area supports multi-line input and auto-resizes based on content.
Predefined Prompts: Use predefined prompts for quick queries.
##Installation
 

1. Clone the repository:

git clone https://github.com/yourusername/Azure_openai_with_customize_UI.git  
cd Azure_openai_with_customize_UI  
 
2. Set up a virtual environment:


python -m venv venv  
source venv/bin/activate   # On Windows use `venv\Scripts\activate`  
 
3. Install the required dependencies:


pip install -r requirements.txt  
 
4. Set up your environment variables. Create a .env file in the root directory and add your Azure and OpenAI credentials:


AZURE_OPENAI_ENDPOINT=Your_Azure_OpenAi_endpoint  
AZURE_OPENAI_API_KEY=Your_Azure_OpenAi_API_key  
AZURE_SEARCH_SERVICE_ENDPOINT=Your_Azure_search_service_endpoint  
AZURE_SEARCH_SERVICE_API_KEY=Your_Azure_search_service_API_key  
AZURE_STORAGE_CONNECTION_STRING=Your_storage_account_connection_string  
 
5. Run the Flask application:


python app.py  
 
6. Open your browser and go to http://127.0.0.1:5000 to access the application.

##Usage
 

Chat with the AI Assistant: Type your message in the input area and press Enter or click the send button. The assistant will respond based on the context provided.
Upload Documents: Click the "Upload File" button, select a file, and upload it. The assistant will use the content of the uploaded documents to provide context-aware responses.
Adjust Settings: Modify the settings for max tokens, top P, temperature, and the number of past messages to customize the assistant's responses.
Toggle Theme: Use the "Toggle Theme" button to switch between dark and light themes.
Predefined Prompts: Use the predefined prompts in the prompt container to quickly generate queries.
Frontend Code Overview
 
The frontend is built using plain HTML, CSS, and JavaScript. Key components include:

Header: Displays the application title.
Settings: Contains input fields and buttons for adjusting settings and uploading files.
Chat Container: Displays the conversation between the user and the assistant.
Input Container: Contains the multi-line input area and send button.
Key Styles
 

Dark Theme: Applied by default, with a dark background and light text.
Light Theme: Can be toggled, with a light background and dark text.
Message Formatting: Different styles for user and assistant messages, including code block handling with a copy button.
Key Scripts
 

sendMessage(): Sends the user's message to the backend and displays the assistant's response.
addMessage(): Adds a message to the chat container, handling text and code blocks.
toggleTheme(): Switches between dark and light themes.
uploadFile(): Handles file upload and triggers the backend to process the document.
checkMode(): Adjusts the UI based on the selected mode (general or document-based).
Backend Code Overview
 
The backend is built using Flask and integrates with Azure Cognitive Services and OpenAI. Key routes include:

/: Renders the main chat interface.
/ask_openai: Handles general queries to the OpenAI API.
/search: Searches documents using Azure Cognitive Search.
/upload: Handles file uploads to Azure Blob Storage and triggers the indexer.
/ask: Handles queries in document-based mode, providing context-aware responses.
License
 
This project is licensed under the MIT License. See the LICENSE file for details.

##Contributing
 
Contributions are welcome! Please fork this repository and submit a pull request for any enhancements or bug fixes.

##Acknowledgements
 

OpenAI for providing the GPT models.
Azure Cognitive Search for search capabilities.
Azure Blob Storage for storage capabilities.
Custumize_UI_ChatGPT-V1.05 Update
 

Fix:
 

Cannot recognize PDF files.
Steps:
 

Install the required dependencies:

pip install -r requirements.txt  
 
2. Replace app.py file.

3. Run app.py:


python app.py  
 
4. Open http://127.0.0.1:5000 on your browser.
