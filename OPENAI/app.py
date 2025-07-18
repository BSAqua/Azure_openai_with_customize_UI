import logging  
import io  
from flask import Flask, render_template, request, jsonify  
import requests  
from flask_cors import CORS  
from azure.search.documents import SearchClient  
from azure.search.documents.models import QueryType  
from azure.core.credentials import AzureKeyCredential  
from azure.storage.blob import BlobServiceClient  
from docx import Document  
import fitz   
  
# Configure logging  
logging.basicConfig(level=logging.INFO)  
logger = logging.getLogger(__name__)  
  
app = Flask(__name__)  
CORS(app)  # Enable CORS  
  
# Azure OpenAI configuration   
endpoint = 'Your_Azure_OpenAi_endpoint'  
api_key = 'Your_Azure_OpenAi_API_key'  
  
headers = {  
    'Content-Type': 'application/json',  
    'api-key': api_key  
}  
  
# Azure Cognitive Search configuration 
search_service_endpoint = "Your_Azure_search_service_endpoint"  
search_api_key = "Your_Azure_search_service_API_key"  
index_name = "index"  # Replace with your indexe name
indexer_name = "indexer"  # Replace with your indexer name  
  
search_client = SearchClient(endpoint=search_service_endpoint,  
                             index_name=index_name,  
                             credential=AzureKeyCredential(search_api_key))  
  
# Azure Storage account configuration  
storage_account_connection_string = "Your_storage_account_connection_string"  
blob_service_client = BlobServiceClient.from_connection_string(storage_account_connection_string)  
container_name = "contanier" # Replace with your container name  
  
@app.route('/')  
def index():  
    return render_template('index.html')  
  
@app.route('/ask_openai', methods=['POST'])  
def ask_openai():  
    try:  
        data = request.json  
        logger.info("接收到的數據: %s", data)  # Log received data for debugging
  
        # Ensure data contains 'messages' field and it is a list
        if 'messages' not in data or not isinstance(data['messages'], list):  
            raise ValueError("無效的數據格式: 'messages' 字段是必需的並且應該是個列表")  
  
        response = requests.post(endpoint, headers=headers, json=data)  
        logger.info("OpenAI API 回應: %s %s", response.status_code, response.text)  # Log API response for debugging 
        response.raise_for_status()  
        return jsonify(response.json())  
    except requests.exceptions.RequestException as e:  
        logger.error("在 /ask_openai 中的錯誤: %s", str(e))  
        return jsonify({"error": str(e)}), 500  
    except ValueError as ve:  
        logger.error("無效的數據格式: %s", str(ve))  
        return jsonify({"error": str(ve)}), 400  
  
@app.route('/search', methods=['POST'])  
def search():  
    try:  
        data = request.json  
        query = data.get('query', '')  
        results = search_client.search(query, query_type=QueryType.SIMPLE)  
        results_list = [result for result in results]  
        return jsonify(results_list)  
    except Exception as e:  
        logger.error("在 /search 中的錯誤: %s", str(e))  
        return jsonify({"error": str(e)}), 500  
  
@app.route('/upload', methods=['POST'])  
def upload():  
    try:  
        file = request.files['file']  
        overwrite = request.form.get('overwrite') == 'true'  # Get the overwrite option  
        blob_client = blob_service_client.get_blob_client(container=container_name, blob=file.filename)  
          
        if not overwrite and blob_client.exists():  
            return jsonify({"message": "文件已存在，未選擇覆蓋!"}), 400  
  
        blob_client.upload_blob(file, overwrite=overwrite)  
  
        # Trigger indexer run  
        indexer_url = f"{search_service_endpoint}/indexers/{indexer_name}/run?api-version=2020-06-30"  
        indexer_response = requests.post(indexer_url, headers={  
            'Content-Type': 'application/json',  
            'api-key': search_api_key  
        })  
  
        if indexer_response.status_code == 202:  
            return jsonify({"message": "文件上傳成功並且索引器已觸發!"})  
        else:  
            return jsonify({"message": "文件上傳成功，但觸發索引器失敗!", "error": indexer_response.text}), 500  
    except Exception as e:  
        logger.error("在 /upload 中的錯誤: %s", str(e))  
        return jsonify({"error": str(e)}), 500   
  
@app.route('/ask', methods=['POST'])  
def ask():  
    try:  
        data = request.json  
        query = data.get('query', '')  
        max_tokens = data.get('max_tokens', 60)  
        top_p = data.get('top_p', 1.0)  
        temperature = data.get('temperature', 0.7)  
        messages = data.get('messages', [])  
  
        logger.info("接收到的數據: %s", data)  
        logger.info("查詢: %s", query)  
  
        # Retrieve document contents from Azure Blob Storage  
        blob_list = blob_service_client.get_container_client(container_name).list_blobs()  
        documents = []  
        for blob in blob_list:  
            blob_client = blob_service_client.get_blob_client(container=container_name, blob=blob.name)  
            blob_data = blob_client.download_blob().readall()  
              
            try:  
                if blob.name.endswith('.docx'):  
                    # Handle .docx files  
                    doc = Document(io.BytesIO(blob_data))  
                    doc_text = '\n'.join([paragraph.text for paragraph in doc.paragraphs])  
                    documents.append(doc_text)  
                elif blob.name.endswith('.pdf'):  
                    # Handle .pdf files  
                    pdf_document = fitz.open(stream=blob_data, filetype="pdf")  
                    pdf_text = ""  
                    for page_num in range(pdf_document.page_count):  
                        page = pdf_document.load_page(page_num)  
                        pdf_text += page.get_text()  
                    documents.append(pdf_text)  
                else:  
                    logger.error("不支持的文件類型: %s", blob.name)  
            except Exception as e:  
                logger.error("在處理文件 %s 時出錯: %s", blob.name, str(e))  
  
        logger.info("找到的文檔: %s", documents)  
  
        # Add retrieved document contents to messages    
        for doc in documents:  
            messages.append({"role": "system", "content": doc})  
  
        openai_data = {  
            "messages": messages,  
            "max_tokens": max_tokens,  
            "top_p": top_p,  
            "temperature": temperature  
        }  
        logger.info("OpenAI 數據: %s", openai_data)  
  
        response = requests.post(endpoint, headers=headers, json=openai_data)  
        logger.info("OpenAI API 回應: %s %s", response.status_code, response.text)  
        response.raise_for_status()  
        return jsonify(response.json())  
    except Exception as e:  
        logger.error("在 /ask 中的錯誤: %s", str(e))  
        return jsonify({"error": str(e)}), 500  
  
if __name__ == '__main__':  
    app.run(debug=True, use_reloader=False)  