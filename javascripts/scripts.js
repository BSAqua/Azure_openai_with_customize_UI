let darkTheme = true;  
let messages = [];  
let generating = false;  
let cachedResults = []; // 緩存搜索結果 

// 动态调整textarea高度  
function adjustTextareaHeight() {  
    const textarea = document.getElementById('user-input');  
    textarea.style.height = 'auto'; // 重置高度以计算新的高度  
    textarea.style.height = `${textarea.scrollHeight}px`; // 设置新的高度  
    
    const maxHeight = 100; // 设置最大高度  
    if (textarea.scrollHeight > maxHeight) {  
      textarea.style.overflowY = 'auto'; // 超过最大高度时显示滚动条  
      textarea.style.height = `${maxHeight}px`; // 固定高度为最大高度  
    } else {  
      textarea.style.overflowY = 'hidden'; // 否则隐藏滚动条  
    }  
  }  
    
  // 使用预设提示  
  function usePrompt(prompt) {  
    document.getElementById('user-input').value = prompt;  
    sendMessage();  
  }  
    
  // 检查模式变更  
  function checkMode() {  
    const mode = document.getElementById('mode-select').value;  
    const promptContainer = document.getElementById('prompt-container');  
    if (mode === 'document') {  
      promptContainer.style.display = 'flex';  
    } else {  
      promptContainer.style.display = 'none';  
    }  
  }  
    
  // 发送消息函数  
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
      messages: messages.slice(-messageCount), // 确保发送的是最近的消息  
      max_tokens: maxTokens,  
      top_p: topP,  
      temperature: temperature  
    };  
    
    if (modelInstructions) {  
      data.messages.unshift({ role: 'system', content: modelInstructions });  
    }  
    
    if (mode === 'document') {  
      data.query = userInput; // 添加查询字段  
      const context = cachedResults.map(result => result.chunk).join('\n\n'); // 将所有缓存的内容合并为一个上下文  
      data.messages.push({ role: 'system', content: context }); // 将上下文添加到消息  
    }  
    
    console.log('发送的数据:', data); // 打印发送的数据以进行调试  
    
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
    
    document.getElementById('user-input').value = ''; // 清空输入框  
    adjustTextareaHeight(); // 确保在发送后重新调整高度  
  }  
    
  // 添加消息到对话框  
  function addMessage(role, content) {  
    const chatContainer = document.getElementById('chat-container');  
    const messageDiv = document.createElement('div');  
    messageDiv.classList.add('message', role);  
    
    // 检查是否包含代码块  
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
    chatContainer.scrollTop = chatContainer.scrollHeight; // 滚动到底部  
  }  
    
  // 切换主题  
  function toggleTheme() {  
    darkTheme = !darkTheme;  
    document.body.classList.toggle('dark-theme', darkTheme);  
    document.body.classList.toggle('light-theme', !darkTheme);  
  }  
    
  // 切换按钮显示  
  function toggleButtons(generating) {  
    const sendButton = document.getElementById('send-button');  
    const stopButton = document.getElementById('stop-button');  
    sendButton.style.display = generating ? 'none' : 'flex';  
    stopButton.style.display = generating ? 'flex' : 'none';  
  }  
    
  // 中止生成  
  function stopGeneration() {  
    toggleButtons(false);  
  }  
    
  // 上传文件  
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
    
  // 用于调整窗口大小的函数  
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
    
  // 检查输入值是否在范围内  
  function checkInputRange(inputId, min, max) {  
    const input = document.getElementById(inputId);  
    input.addEventListener('input', () => {  
      if (input.value < min || input.value > max) {  
        alert(`值超出范围！${inputId} 的有效范围是 ${min} 到 ${max}`);  
        input.value = Math.min(Math.max(input.value, min), max); // 重置为有效范围内的值  
      }  
    });  
  }  
    
  // 初始化检查模式和输入范围  
  document.addEventListener('DOMContentLoaded', function() {  
    checkMode();  
    checkInputRange('max-tokens', 1, 4096);  
    checkInputRange('top-p', 0.0, 1.0);  
    checkInputRange('temperature', 0.0, 1.0);  
    checkInputRange('message-count', 1, 20);  
    
    // 初始化textarea高度  
    adjustTextareaHeight();  
    document.getElementById('user-input').addEventListener('input', adjustTextareaHeight); // 绑定输入事件  
  });  
