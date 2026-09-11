chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Handle volume sync broadcasting across tabs
  if (message.type === 'BROADCAST_VOLUME') {
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach((tab) => {
        if (tab.url && !tab.url.startsWith('chrome://')) {
          chrome.tabs.sendMessage(tab.id, {
            type: 'APPLY_REMOTE_VOLUME',
            volume: message.volume
          }).catch(() => {});
        }
      });
    });
  }

  // Voice Command: Open LinkedIn
  if (message.type === 'OPEN_LINKEDIN') {
    chrome.tabs.create({ url: 'https://www.linkedin.com' });
  }

  // Voice Command: Open Instagram
  if (message.type === 'OPEN_INSTAGRAM') {
    chrome.tabs.create({ url: 'https://www.instagram.com' });
  }

  if (message.type === 'OPEN_KTU') {
    chrome.tabs.create({ url: 'https://ktu.edu.in' });
  }
   if (message.type === 'OPEN_GEMINI') {
    chrome.tabs.create({ url: 'https://gemini.google.com' });
  }
});