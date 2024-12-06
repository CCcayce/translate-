// content.js
console.log('content.js loaded');

// 添加消息监听器来处理翻译状态的更新
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "updateTranslationState") {
    // 更新翻译状态
    window.isTranslationEnabled = request.state;
    console.log('Translation state updated:', request.state);
    // 发送响应
    sendResponse({ success: true });
    return true;
  }
});

// 添加检查文本是否为中文的函数
function isChineseText(text) {
  // 匹配中文字符的正则表达式
  const chineseRegex = /[\u4e00-\u9fa5]/;
  // 如果文本中包含中文字符，返回true
  return chineseRegex.test(text);
}

// 修改双击事件监听器
document.addEventListener('dblclick', async function (event) {
  // 获取选中的文本
  let selection = window.getSelection();
  let selectedText = selection.toString().trim();

  // 如果没有选中文本，直接返回
  if (!selectedText) {
    return;
  }

  // 检查是否为中文文本
  if (isChineseText(selectedText)) {
    console.log('选中的是中文文本，跳过翻译');
    return;
  }

  // 检查翻译是否启用
  try {
    const result = await chrome.storage.local.get(['translationEnabled']);
    if (result.translationEnabled === false) {
      return;
    }

    console.log('Selected text for translation:', selectedText);
    try {
      // 使用Promise包装chrome.runtime.sendMessage
      const response = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
          { action: "translate", text: selectedText },
          (response) => {
            if (chrome.runtime.lastError) {
              console.error('Message sending failed:', chrome.runtime.lastError);
              reject(chrome.runtime.lastError);
            } else {
              resolve(response);
            }
          }
        );
      });

      console.log('Translation response:', response);
      if (response.error) {
        console.error('Translation failed:', response.error);
      } else {
        showTranslation(selection, response.translation);
      }
    } catch (error) {
      console.error('Error during translation request:', error);
    }
  } catch (error) {
    console.error('Error checking translation state:', error);
  }
});

// 显示翻译结果
function showTranslation(selection, translation) {
  // 移除可能存在的旧翻译框
  const existingPopup = document.getElementById('translation-popup');
  if (existingPopup) {
    existingPopup.remove();
  }

  // 创建翻译结果容器
  let translationDiv = document.createElement('div');
  translationDiv.id = 'translation-popup';
  
  
  // 创建内容区
  let content = document.createElement('div');
  content.className = 'translation-content';
  content.textContent = translation;
  
  // 组装翻译框
  translationDiv.appendChild(content);

  // 设置样式
  const styles = `
    #translation-popup {
      position: absolute;
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      font-size: 14px;
      max-width: 300px;
      min-width: 200px;
      opacity: 0;
      transform: translateY(-10px);
      transition: all 0.2s ease;
      z-index: 999999;
    }
    
    #translation-popup .title-bar {
      background: #f8f9fa;
      color: #333;
      padding: 8px 12px;
      border-radius: 8px 8px 0 0;
      font-size: 12px;
      font-weight: 500;
      border-bottom: 1px solid #eee;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    #translation-popup .close-button {
      cursor: pointer;
      color: #666;
      font-size: 18px;
      line-height: 1;
      padding: 0 4px;
    }
    
    #translation-popup .close-button:hover {
      color: #333;
    }
    
    #translation-popup .translation-content {
      padding: 12px;
      line-height: 1.5;
      color: #333;
      word-wrap: break-word;
    }
  `;

  // 添加样式到页面
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);

  // 获取选中文本的位置
  let range = selection.getRangeAt(0);
  let rect = range.getBoundingClientRect();

  // 将翻译框添加到页面
  document.body.appendChild(translationDiv);

  // 计算最佳位置
  const popupRect = translationDiv.getBoundingClientRect();
  let left = window.scrollX + rect.left;
  let top = window.scrollY + rect.top - popupRect.height - 10;

  // 确保翻译框不会超出屏幕边界
  if (top < window.scrollY) {
    // 如果上方空间不够，显示在下方
    top = window.scrollY + rect.bottom + 10;
  }
  if (left + popupRect.width > window.innerWidth) {
    // 如果右边空间不够，向左偏移
    left = window.innerWidth - popupRect.width - 10;
  }

  // 设置位置
  translationDiv.style.left = `${left}px`;
  translationDiv.style.top = `${top}px`;

  // 添加淡入效果
  requestAnimationFrame(() => {
    translationDiv.style.opacity = '1';
    translationDiv.style.transform = 'translateY(0)';
  });

  // 点击页面其他地方关闭翻译框
  const handleClickOutside = (event) => {
    if (!translationDiv.contains(event.target)) {
      translationDiv.style.opacity = '0';
      translationDiv.style.transform = 'translateY(-10px)';
      setTimeout(() => {
        translationDiv.remove();
        document.removeEventListener('click', handleClickOutside);
      }, 200);
    }
  };

  // 延迟添加点击监听，避免立即触发
  setTimeout(() => {
    document.addEventListener('click', handleClickOutside);
  }, 100);
}
