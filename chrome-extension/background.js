// Background service worker for ReviewResponder
// Handles context menu and communication between popup and content script

const API_URL = 'https://review-responder.onrender.com/api';

// Create context menu on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'generateResponse',
    title: 'Generate Response with ReviewResponder',
    contexts: ['selection']
  });
  console.log('[RR] Context menu created');
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'generateResponse' && info.selectionText) {
    console.log('[RR] Context menu clicked, selected text:', info.selectionText.substring(0, 50) + '...');

    // Send message to content script to show panel with selected text
    try {
      await chrome.tabs.sendMessage(tab.id, {
        action: 'showPanelWithText',
        reviewText: info.selectionText
      });
    } catch (error) {
      console.error('[RR] Error sending message to content script:', error);
      // Content script might not be loaded, inject it
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        });
        await chrome.scripting.insertCSS({
          target: { tabId: tab.id },
          files: ['content.css']
        });
        // Try again after injection
        setTimeout(async () => {
          await chrome.tabs.sendMessage(tab.id, {
            action: 'showPanelWithText',
            reviewText: info.selectionText
          });
        }, 100);
      } catch (injectError) {
        console.error('[RR] Error injecting content script:', injectError);
      }
    }
  }
});

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getSelectedText') {
    // Get selected text from active tab
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (tabs[0]) {
        try {
          const result = await chrome.tabs.sendMessage(tabs[0].id, { action: 'getSelection' });
          sendResponse(result);
        } catch (error) {
          sendResponse({ text: '' });
        }
      }
    });
    return true; // Keep channel open for async response
  }
});
