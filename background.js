// Initialize extension
console.log("Peeping Tom extension initialized");

// Function to inject content script
async function injectContentScript(tabId) {
  try {
    await browser.tabs.executeScript(tabId, {
      file: "content.js",
      runAt: "document_start"
    });
    console.log("Content script injected into tab:", tabId);
    return true;
  } catch (error) {
    console.error("Error injecting content script:", error);
    return false;
  }
}

// Handle messages from content script
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Message received in background:", message);
  
  if (message.action === "captureScreen") {
    console.log("Capturing screen for selection:", message.selection);
    
    // Use the tabs API to capture the visible tab
    browser.tabs.captureVisibleTab(null, {
      format: "png"
    }).then(dataUrl => {
      console.log("Screen captured successfully");
      sendResponse({ imageData: dataUrl });
    }).catch(error => {
      console.error("Error capturing screen:", error);
      sendResponse({ error: "Failed to capture screen" });
    });
    
    return true; // Keep the message channel open for async response
  }
});

// Handle keyboard shortcuts
browser.commands.onCommand.addListener(async (command) => {
  console.log("Command received:", command);
  
  if (command === "activate-selection") {
    try {
      // Get active tab
      const tabs = await browser.tabs.query({active: true, currentWindow: true});
      if (!tabs[0]) {
        console.error("No active tab found");
        return;
      }

      const tab = tabs[0];
      
      // Check if tab is valid
      if (tab.url.startsWith('about:') || 
          tab.url.startsWith('chrome:') || 
          tab.url.startsWith('moz-extension:')) {
        console.log("Ignoring command on system page");
        return;
      }

      // Try sending message to content script
      try {
        await browser.tabs.sendMessage(tab.id, {action: "activate"});
        console.log("Selection tool activated in tab:", tab.id);
      } catch (error) {
        // If content script not loaded, inject it first then try again
        console.log("Content script not responding, injecting it first:", error);
        await injectContentScript(tab.id);
        await browser.tabs.sendMessage(tab.id, {action: "activate"});
        console.log("Selection tool activated after injection in tab:", tab.id);
      }
      
    } catch (error) {
      console.error("Error handling command:", error);
    }
  } else {
    console.warn("Unknown command received:", command);
  }
});

// Handle tab updates to ensure content script is loaded
browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && 
        !tab.url.startsWith('about:') && 
        !tab.url.startsWith('chrome:') && 
        !tab.url.startsWith('moz-extension:')) {
        console.log("Tab updated, injecting content script");
        injectContentScript(tabId).catch(error => {
            console.error("Error injecting content script on tab update:", error);
        });
    }
});

// Handle extension installation/update
browser.runtime.onInstalled.addListener(async (details) => {
  console.log("Extension installed/updated:", details.reason);
  
  // Register commands
  const commands = await browser.commands.getAll();
  console.log("Registered commands:", commands);
  
  // Inject into all existing tabs
  const tabs = await browser.tabs.query({});
  for (const tab of tabs) {
    if (!tab.url.startsWith('about:') && 
        !tab.url.startsWith('chrome:') && 
        !tab.url.startsWith('moz-extension:')) {
      await injectContentScript(tab.id).catch(error => {
        console.error("Error injecting content script during install:", error);
      });
    }
  }
});
