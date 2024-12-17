# Azure_openai_with_customize_UI
A Flask application that integrates Azure OpenAI Service with a customizable user interface. This project includes functionality for querying OpenAI's API, searching documents via Azure Cognitive Search, and uploading files to Azure Blob Storage.  
  
## Features  
  
- Customizable user interface with light and dark themes.  
- Query OpenAI's API for responses.  
- Upload files to Azure Blob Storage.  
- Search documents using Azure Cognitive Search.  
- Use predefined prompts for quick queries.  
  
## Prerequisites  
  
- Python 3.7+  
- Azure account with access to OpenAI, Cognitive Search, and Blob Storage services.  
  
## Installation  
  
1. **Clone the repository**:  
    ```bash  
    git clone https://github.com/yourusername/Azure_openai_with_customize_UI.git  
    cd Azure_openai_with_customize_UI  
    ```  
  
2. **Set up a virtual environment**:  
    ```bash  
    python -m venv venv  
    source venv/bin/activate   # On Windows use `venv\Scripts\activate`  
    ```  
  
3. **Install dependencies**:  
    ```bash  
    pip install -r requirements.txt  
    ```  
  
4. **Configure environment variables**:  
    - Create a `.env` file in the project root directory and add the following variables:  
    ```plaintext  
    OPENAI_ENDPOINT=https://your-openai-endpoint  
    OPENAI_API_KEY=your-openai-api-key  
    AZURE_SEARCH_SERVICE_ENDPOINT=https://your-azure-search-service-endpoint  
    AZURE_SEARCH_API_KEY=your-azure-search-api-key  
    STORAGE_ACCOUNT_CONNECTION_STRING=your-storage-account-connection-string  
    ```  
  
## Running the Application  
  
1. **Start the Flask application**:  
    ```bash  
    python app.py  
    ```  
  
2. **Open your browser and visit**:  
    ```  
    http://localhost:5000  
    ```

# Usage
 

# User Interface
 

Max Tokens: Set the maximum number of tokens for the response.
Top P: Set the value for nucleus sampling. Lower values produce more deterministic responses.
Temperature: Controls the randomness of the response. Lower values make the output more deterministic.
Number of past messages to include: Set the number of past messages to include in the context.
Upload File: Upload files to Azure Blob Storage for document-based queries.
Mode: Switch between general OpenAI and document-based OpenAI modes.
Send Message: Enter your query and send it to OpenAI.
Predefined Prompts
 

Use the predefined prompts in the prompt container to quickly generate queries.
# Toggle Theme
 

Use the "Toggle Theme" button to switch between light and dark themes.
# Contributing
 
Contributions are welcome! Please fork this repository and submit a pull request for any enhancements or bug fixes.

# License
 
This project is licensed under the MIT License. See the LICENSE file for details.

#Acknowledgements
 

[OpenAI](https://www.openai.com/)
[Azure Cognitive Search](https://azure.microsoft.com/en-us/services/search/)
[Azure Blob Storage](https://azure.microsoft.com/en-us/services/storage/blobs/)

