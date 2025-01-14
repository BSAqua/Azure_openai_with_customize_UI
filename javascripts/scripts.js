let darkTheme = true;  
let messages = [];  
let generating = false;  
let cachedResults = []; // Cache search results  
  
// Dynamically adjust textarea height  
function adjustTextareaHeight() {  
    const textarea = document.getElementById('user-input');  
    textarea.style.height = 'auto'; // Reset height to calculate new height  
    textarea.style.height = `${textarea.scrollHeight}px`; // Set new height  
  
    const maxHeight = 100; // Set maximum height  
    if (textarea.scrollHeight > maxHeight) {  
        textarea.style.overflowY = 'auto'; // Show scrollbar if height exceeds max height  
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
  
// Check mode change  
function checkMode() {  
    const mode = document.getElementById('mode-select').value;  
    const promptContainer = document.getElementById('prompt-container');  
    if (mode === 'document') {  
        promptContainer.style.display = 'flex';  
    } else {  
        promptContainer.style.display = 'none';  
    }  
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
        messages: messages.slice(-messageCount), // Ensure sending the most recent messages  
        max_tokens: maxTokens,  
        top_p: topP,  
        temperature: temperature  
    };  
  
    if (modelInstructions) {  
        data.messages.unshift({ role: 'system', content: modelInstructions });  
    }  
  
    if (mode === 'document') {  
        data.query = userInput; // Add query field  
        const context = cachedResults.map(result => result.chunk).join('\n\n'); // Combine all cached content into one context  
        data.messages.push({ role: 'system', content: context }); // Add context to messages  
    }  
  
    console.log('Data sent:', data); // Log sent data for debugging  
  
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
    adjustTextareaHeight(); // Ensure height adjustment after sending  
}  
  
// Add message to chat container  
function addMessage(role, content) {  
    const chatContainer = document.getElementById('chat-container');  
    const messageDiv = document.createElement('div');  
    messageDiv.classList.add('message', role);  
  
    // Check if it contains code block  
    if (content.includes('```')) {  
        const parts = content.split('```');  
        parts.forEach((part, index) => {  
            if (index % 2 === 0) {  
                const textPart = document.createElement('div');  
                textPart.textContent = part;  
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
        messageDiv.textContent = content;  
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
    if (!file) return;  
  
    const formData = new FormData();  
    formData.append('file', file);  
  
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
  
// Functions for resizing settings panel  
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
  
// Check if input values are within range  
function checkInputRange(inputId, min, max) {  
    const input = document.getElementById(inputId);  
    input.addEventListener('input', () => {  
        if (input.value < min || input.value > max) {  
            alert(`Value out of range! Valid range for ${inputId} is ${min} to ${max}`);  
            input.value = Math.min(Math.max(input.value, min), max); // Reset to valid range value  
        }  
    });  
}  
  
// Initialize check mode and input range  
document.addEventListener('DOMContentLoaded', function() {  
    checkMode();  
    checkInputRange('max-tokens', 1, 4096);  
    checkInputRange('top-p', 0.0, 1.0);  
    checkInputRange('temperature', 0.0, 1.0);  
    checkInputRange('message-count', 1, 20);  
  
    // Initialize textarea height  
    adjustTextareaHeight();  
    document.getElementById('user-input').addEventListener('input', adjustTextareaHeight); // Bind input event  
});  
