// Relays the mic volume from the active controller tab to ALL open tabs
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'BROADCAST_VOLUME') {
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach((tab) => {
        // Send to every tab (except error pages or chrome internal URLs)
        if (tab.url && !tab.url.startsWith('chrome://')) {
          chrome.tabs.sendMessage(tab.id, {
            type: 'APPLY_REMOTE_VOLUME',
            volume: message.volume
          }).catch(() => {
            // Ignore errors for tabs where content script isn't loaded yet
          });
        }
      });
    });
  }
});