// background.js
console.log('Background script loaded');

// 监听来自content.js的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('收到翻译请求:', request);
  
  if (request.action === "translate") {
    // 立即返回true表示我们将异步发送响应
    (async () => {
      try {
        const translation = await fetchTranslation(request.text);
        console.log('翻译结果:', translation);
        sendResponse({ translation: translation });
      } catch (error) {
        console.error('翻译错误:', error);
        sendResponse({ error: error.message || "翻译失败" });
      }
    })();
    return true; // 保持消息通道开放
  }
});

// 翻译函数
async function fetchTranslation(text) {
  // 使用免费的 MyMemory Translation API 替代
  const url = 'https://api.mymemory.translated.net/get';
  
  console.log('发送翻译请求:', text);
  
  try {
    // 构建查询参数
    const params = new URLSearchParams({
      q: text,
      langpair: 'en|zh',
    });

    const response = await fetch(`${url}?${params.toString()}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API错误响应:', errorText);
      throw new Error(`翻译服务错误: ${response.status}`);
    }

    const data = await response.json();
    console.log('API响应:', data);

    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      return data.responseData.translatedText;
    } else {
      console.error('翻译API返回错误:', data);
      throw new Error(data.responseDetails || '翻译服务返回了无效的数据格式');
    }
  } catch (error) {
    console.error('翻译请求失败:', error);
    if (error.message.includes('Failed to fetch')) {
      throw new Error('网络连接错误，请检查您的网络连接');
    }
    throw error;
  }
}
