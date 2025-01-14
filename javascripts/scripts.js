let darkTheme = true; // Boolean to track the current theme  
let messages = []; // Array to store chat messages  
let generating = false; // Boolean to track if a response is being generated  
let cachedResults = []; // Array to cache search results  
  
// Initialize Markdown-it with options  
const md = window.markdownit({  
    html: true, // Enable HTML tags  
    breaks: true, // Convert line breaks to <br>  
    linkify: true // Auto-detect links  
});  
  
// Event listener for when the DOM is fully loaded  
document.addEventListener('DOMContentLoaded', function() {  
    checkMode(); // Check the selected mode  
    checkInputRange('max-tokens', 1, 4096); // Check range for max tokens input  
    checkInputRange('top-p', 0.0, 1.0); // Check range for top-p input  
    checkInputRange('temperature', 0.0, 1.0); // Check range for temperature input  
    checkInputRange('message-count', 1, 20); // Check range for message count input  
  
    // Initialize textarea height  
    adjustTextareaHeight();  
    document.getElementById('user-input').addEventListener('input', adjustTextareaHeight); // Bind input event  
  
    // Bind keydown event to send message on Enter key press  
    document.getElementById('user-input').addEventListener('keydown', function(event) {  
        if (event.key === 'Enter' && !event.shiftKey) {  
            event.preventDefault();  
            sendMessage();  
        }  
    });  
});  
  
// Check mode change  
function checkMode() {  
    const mode = document.getElementById('mode-select').value;  
    const promptContainer = document.getElementById('prompt-container');  
    const fileUploadContainer = document.getElementById('file-upload-container');  
  
    if (mode === 'document') {  
        promptContainer.style.display = 'flex';  
        fileUploadContainer.style.display = 'block'; // Show file upload section  
    } else {  
        promptContainer.style.display = 'none';  
        fileUploadContainer.style.display = 'none'; // Hide file upload section  
    }  
}  
  
// Adjust textarea height dynamically  
function adjustTextareaHeight() {  
    const textarea = document.getElementById('user-input');  
    textarea.style.height = 'auto'; // Reset height to calculate new height  
    textarea.style.height = `${textarea.scrollHeight}px`; // Set new height  
  
    const maxHeight = 100; // Set maximum height  
    if (textarea.scrollHeight > maxHeight) {  
        textarea.style.overflowY = 'auto'; // Show scrollbar if exceeded max height  
        textarea.style.height = `${maxHeight}px`; // Fix height to max height  
    } else {  
        textarea.style.overflowY = 'hidden'; // Hide scrollbar otherwise  
    }  
}  
  
// Use preset prompt  
function usePrompt(prompt) {  
    document.getElementById('user-input').value = prompt;  
    sendMessage();  
}  
  
// Send message function  
function sendMessage() {  
    const userInput = document.getElementById('user-input').value.trim();  
    const modelInstructions = document.getElementById('model-instructions').value.trim();  
    if (!userInput && !modelInstructions) return;  
  
    addMessage('user', userInput);  
    messages.push({ role: 'user', content: userInput });  
  
    const mode = document.getElementById('mode-select').value;  
    const endpoint = mode === 'document' ? '/ask' : '/ask_openai';  
  
    const maxTokens = parseInt(document.getElementById('max-tokens').value);  
    const topP = parseFloat(document.getElementById('top-p').value);  
    const temperature = parseFloat(document.getElementById('temperature').value);  
    const messageCount = parseInt(document.getElementById('message-count').value);  
  
    const data = {  
        messages: messages.slice(-messageCount), // Ensure only recent messages are sent  
        max_tokens: maxTokens,  
        top_p: topP,  
        temperature: temperature  
    };  
  
    if (modelInstructions) {  
        data.messages.unshift({ role: 'system', content: modelInstructions });  
    }  
  
    if (mode === 'document') {  
        data.query = userInput; // Add query field  
        const context = cachedResults.map(result => result.chunk).join('\n\n'); // Combine all cached content as context  
        data.messages.push({ role: 'system', content: context }); // Add context to messages  
    }  
  
    console.log('Data sent:', data); // Log data sent for debugging  
  
    toggleButtons(true);  
  
    fetch(endpoint, {  
        method: 'POST',  
        headers: {  
            'Content-Type': 'application/json'  
        },  
        body: JSON.stringify(data)  
    })  
    .then(response => {  
        if (!response.ok) {  
            return response.text().then(text => { throw new Error(text) });  
        }  
        return response.json();  
    })  
    .then(result => {  
        if (result.choices && result.choices.length > 0) {  
            const answer = result.choices[0].message.content;  
            messages.push({ role: 'assistant', content: answer });  
            addMessage('assistant', answer);  
        } else {  
            addMessage('assistant', 'No answer received from OpenAI.');  
        }  
    })  
    .catch(error => {  
        console.error('Error:', error);  
        addMessage('assistant', `Error: ${error.message}`);  
    })  
    .finally(() => {  
        toggleButtons(false);  
    });  
  
    document.getElementById('user-input').value = ''; // Clear input field  
    adjustTextareaHeight(); // Ensure height is adjusted after sending  
}  
  
// Add message to chat container  
function addMessage(role, content) {  
    const chatContainer = document.getElementById('chat-container');  
    const messageDiv = document.createElement('div');  
    messageDiv.classList.add('message', role);  
  
    // Convert Markdown to HTML  
    const htmlContent = md.render(content);  
    console.log('Generated HTML:', htmlContent); // Log generated HTML content  
  
    // Check if message contains code block  
    if (content.includes('```')) {  
        const parts = content.split('```');  
        parts.forEach((part, index) => {  
            if (index % 2 === 0) {  
                const textPart = document.createElement('div');  
                textPart.innerHTML = md.render(part);  
                messageDiv.appendChild(textPart);  
            } else {  
                const codeBlock = document.createElement('div');  
                codeBlock.classList.add('code-block');  
                const pre = document.createElement('pre');  
                pre.textContent = part;  
                codeBlock.appendChild(pre);  
  
                const copyButton = document.createElement('button');  
                copyButton.classList.add('copy-button');  
                copyButton.textContent = 'Copy';  
                copyButton.addEventListener('click', () => {  
                    navigator.clipboard.writeText(part).then(() => {  
                        copyButton.textContent = 'Copied!';  
                        setTimeout(() => { copyButton.textContent = 'Copy'; }, 2000);  
                    });  
                });  
                codeBlock.appendChild(copyButton);  
  
                messageDiv.appendChild(codeBlock);  
            }  
        });  
    } else {  
        messageDiv.innerHTML = htmlContent;  
    }  
  
    chatContainer.appendChild(messageDiv);  
    chatContainer.scrollTop = chatContainer.scrollHeight; // Scroll to bottom  
}  
  
// Toggle theme  
function toggleTheme() {  
    darkTheme = !darkTheme;  
    document.body.classList.toggle('dark-theme', darkTheme);  
    document.body.classList.toggle('light-theme', !darkTheme);  
}  
  
// Toggle button display  
function toggleButtons(generating) {  
    const sendButton = document.getElementById('send-button');  
    const stopButton = document.getElementById('stop-button');  
    sendButton.style.display = generating ? 'none' : 'flex';  
    stopButton.style.display = generating ? 'flex' : 'none';  
}  
  
// Stop generation  
function stopGeneration() {  
    toggleButtons(false);  
}  
  
// Upload file  
function uploadFile() {  
    const fileInput = document.getElementById('file-upload');  
    const file = fileInput.files[0];  
    const overwrite = document.getElementById('overwrite-file').checked; // Get the value of the checkbox  
    if (!file) return;  
  
    const formData = new FormData();  
    formData.append('file', file);  
    formData.append('overwrite', overwrite); // Append the overwrite option  
  
    fetch('/upload', {  
        method: 'POST',  
        body: formData  
    })  
    .then(response => {  
        if (!response.ok) {  
            return response.text().then(text => { throw new Error(text) });  
        }  
        return response.json();  
    })  
    .then(result => {  
        if (result.message) {  
            alert(result.message);  
        } else {  
            alert(`Error: ${result.error}`);  
        }  
    })  
    .catch(error => {  
        console.error('Error:', error);  
        alert(`Error: ${error.message}`);  
    });  
}  
  
// Function to resize the settings panel  
const settings = document.getElementById('settings');  
const resizer = document.getElementById('resizer');  
const container = document.querySelector('.container');  
let startX, startWidth;  
  
resizer.addEventListener('mousedown', function(e) {  
    startX = e.clientX;  
    startWidth = settings.getBoundingClientRect().width;  
    document.documentElement.addEventListener('mousemove', doDrag, false);  
    document.documentElement.addEventListener('mouseup', stopDrag, false);  
});  
  
function doDrag(e) {  
    const newWidth = startWidth + e.clientX - startX;  
    const minWidth = 200;  
    const maxWidth = container.getBoundingClientRect().width * 0.5;  
    if (newWidth >= minWidth && newWidth <= maxWidth) {  
        settings.style.width = newWidth + 'px';  
    }  
}  
  
function stopDrag(e) {  
    document.documentElement.removeEventListener('mousemove', doDrag, false);  
    document.documentElement.removeEventListener('mouseup', stopDrag, false);  
}  
  
// Check if input value is within range  
function checkInputRange(inputId, min, max) {  
    const input = document.getElementById(inputId);  
  
    input.addEventListener('blur', () => {  
        if (input.value < min || input.value > max) {  
            alert(`Value out of range! Valid range for ${inputId} is ${min} to ${max}`);  
            input.value = Math.min(Math.max(input.value, min), max); // Reset to valid range value  
        }  
    });  
}  
