let darkTheme = true;  
let messages = [];  
let generating = false;  
let cachedResults = []; // cache search results 
let modelInstructionsAdded = false; // Variable to track if model instructions have been added   
// Initialize markdown-it  
const md = window.markdownit({  
    html: true, // Enable HTML tags  
    breaks: true, // Convert line breaks to <br>  
    linkify: true // Automatically detect links  
});  
  
// DOMContentLoaded event  
document.addEventListener('DOMContentLoaded', function() {  
    checkMode();  
    checkInputRange('max-tokens', 1, 4096);  
    checkInputRange('top-p', 0.0, 1.0);  
    checkInputRange('temperature', 0.0, 1.0);  
    checkInputRange('message-count', 1, 20);  
  
    // Initialize textarea height  
    adjustTextareaHeight();  
    document.getElementById('user-input').addEventListener('input', adjustTextareaHeight);  
  
    // Bind Enter key to send message event  
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
  
// Send message  
function sendMessage() {  
    const userInput = document.getElementById('user-input').value.trim();  
    const modelInstructions = document.getElementById('model-instructions').value.trim();  
  
    if (!userInput && !modelInstructions) return;  
  
    // Add user message to chat container only if there is user input  
    if (userInput) {  
        addMessage('user', userInput);  
        messages.push({ role: 'user', content: userInput });  
    }  
  
    const mode = document.getElementById('mode-select').value;  
    const endpoint = mode === 'document' ? '/ask' : '/ask_openai';  
  
    const maxTokens = parseInt(document.getElementById('max-tokens').value);  
    const topP = parseFloat(document.getElementById('top-p').value);  
    const temperature = parseFloat(document.getElementById('temperature').value);  
    const messageCount = parseInt(document.getElementById('message-count').value);  
  
    // Prepare data for the API request  
    const data = {  
        messages: messages.slice(-messageCount), // Ensure only recent messages are sent  
        max_tokens: maxTokens,  
        top_p: topP,  
        temperature: temperature  
    };  
  
    // Add model instructions as a system message if not already added  
    if (modelInstructions && !modelInstructionsAdded) {  
        messages.unshift({ role: 'system', content: modelInstructions });  
        modelInstructionsAdded = true; // Set flag to true to avoid adding it again  
    }  
  
    // Add model instructions to the data but not to the messages array again  
    if (modelInstructions) {  
        data.messages.unshift({ role: 'system', content: modelInstructions });  
    }  
  
    if (mode === 'document') {  
        data.query = userInput; // Add query field  
        const context = cachedResults.map(result => result.chunk).join('\n\n'); // Combine all cached content as context  
        data.messages.push({ role: 'system', content: context }); // Add context to messages  
    }  
  
    console.log('Data sent:', data); // Debugging: log the data being sent  
  
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
  
    // Clear input field and adjust textarea height  
    document.getElementById('user-input').value = '';  
    adjustTextareaHeight();  
}  
  
// Add message to chat container  
function addMessage(role, content) {  
    const chatContainer = document.getElementById('chat-container');  
    const messageDiv = document.createElement('div');  
    messageDiv.classList.add('message', role);  
  
    const markdownContainer = document.createElement('div');  
    markdownContainer.classList.add('markdown-content');  
  
    // Check if the content contains code blocks  
    if (content.includes('```')) {  
        const parts = content.split(/```/g);  
        parts.forEach((part, index) => {  
            if (index % 2 === 0) {  
                // Non-code part  
                const textPart = document.createElement('div');  
                textPart.innerHTML = md.render(part);  
                markdownContainer.appendChild(textPart);  
            } else {  
                // Code part  
                const codeBlock = document.createElement('div');  
                codeBlock.classList.add('code-block');  
                const pre = document.createElement('pre');  
                pre.textContent = part.trim(); // Remove any leading/trailing whitespace  
  
                codeBlock.appendChild(pre);  
  
                // Add copy button for the assistant role  
                if (role === 'assistant') {  
                    const copyButton = document.createElement('button');  
                    copyButton.classList.add('copy-button');  
                    copyButton.textContent = 'Copy';  
                    copyButton.addEventListener('click', async () => {  
                        try {  
                            await navigator.clipboard.writeText(part);  
                            copyButton.textContent = 'Copied!';  
                            setTimeout(() => { copyButton.textContent = 'Copy'; }, 2000);  
                        } catch (err) {  
                            copyButton.textContent = 'Failed to copy';  
                            setTimeout(() => { copyButton.textContent = 'Copy'; }, 2000);  
                        }  
                    });  
                    codeBlock.appendChild(copyButton);  
                }  
  
                markdownContainer.appendChild(codeBlock);  
            }  
        });  
    } else {  
        markdownContainer.innerHTML = md.render(content);  
    }  
  
    messageDiv.appendChild(markdownContainer);  
    chatContainer.appendChild(messageDiv);  
    chatContainer.scrollTop = chatContainer.scrollHeight; // Scroll to bottom  
  
    // Adjust text color based on background color  
    adjustTextColorBasedOnBackground(messageDiv);  
}     
  
// Adjust text color based on background color  
function adjustTextColorBasedOnBackground(element) {  
    const bgColor = window.getComputedStyle(element).backgroundColor;  
    const rgb = bgColor.match(/\d+/g).map(Number);  
    const brightness = (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000;  
  
    if (brightness > 125) {  
        element.style.color = '#000000'; // Dark text for light background  
    } else {  
        element.style.color = '#FFFFFF'; // Light text for dark background  
    }  
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
  
// Resize settings panel  
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