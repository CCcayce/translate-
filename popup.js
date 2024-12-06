// popup.js
console.log('popup.js');
document.addEventListener('DOMContentLoaded', function () {
  let toggleButton = document.getElementById('toggleTranslation');

  // 从存储中获取当前翻译状态
  chrome.storage.local.get('isTranslationEnabled', function (data) {
    let isTranslationEnabled = data.isTranslationEnabled === undefined ? true : data.isTranslationEnabled;
    updateButtonState(isTranslationEnabled);

    toggleButton.addEventListener('click', function () {
      // 切换翻译状态
      isTranslationEnabled = !isTranslationEnabled;
      chrome.storage.local.set({ 'isTranslationEnabled': isTranslationEnabled }, function () {
        updateButtonState(isTranslationEnabled);
        // 通知content.js更新状态
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
          if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError);
            return;
          }
          
          if (tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, 
              { action: "updateTranslationState", state: isTranslationEnabled },
              function(response) {
                if (chrome.runtime.lastError) {
                  console.log('状态更新可能失败，页面可能需要刷新');
                }
              }
            );
          }
        });
      });
    });
  });
});

function updateButtonState(isEnabled) {
  const toggleButton = document.getElementById('toggleTranslation');
  toggleButton.textContent = isEnabled ? '禁用翻译' : '启用翻译';
  toggleButton.className = isEnabled ? 'enabled' : 'disabled';
}
