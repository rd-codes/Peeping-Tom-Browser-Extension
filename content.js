// content.js
console.log("Content script loaded");

let selecting = false;
let selectionStart = null;
let overlay = null;
let isProcessing = false;
let selectionElement = null;

// Listen for activation message from background script
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Message received:", message);
  
  if (message.action === "activate") {
    console.log("Activating selection mode");
    startSelection();
    sendResponse({status: "activated"});
  }
  
  return true;  // Important for async response handling
});

function startSelection() {
  if (selecting) {
    console.log("Selection already active");
    return;
  }
  
  selecting = true;
  console.log("Starting selection mode");
  
  // Change cursor to indicate selection mode
  document.body.style.cursor = "crosshair";
  
  // Add event listeners with capture phase
  document.addEventListener("mousedown", handleSelectionStart, { capture: true });
  document.addEventListener("mousemove", handleSelectionMove, { capture: true });
  document.addEventListener("mouseup", handleSelectionEnd, { capture: true });
  document.addEventListener("keydown", handleEscapeKey, { capture: true });
}

function handleSelectionStart(e) {
  if (!selecting) return;
  
  e.preventDefault();
  e.stopPropagation();
  
  console.log("Selection started at:", e.clientX, e.clientY);
  
  // Save start position
  selectionStart = { x: e.clientX, y: e.clientY };
  
  // Create selection element
  selectionElement = document.createElement("div");
  selectionElement.id = "peeping-tom-selection";
  selectionElement.style.position = "fixed";
  selectionElement.style.left = `${selectionStart.x}px`;
  selectionElement.style.top = `${selectionStart.y}px`;
  selectionElement.style.border = "2px dashed #3498db";
  selectionElement.style.backgroundColor = "rgba(52, 152, 219, 0.1)";
  selectionElement.style.zIndex = "10000";
  selectionElement.style.pointerEvents = "none";
  
  document.body.appendChild(selectionElement);
}

function handleSelectionMove(e) {
  if (!selecting || !selectionStart) return;
  
  const selectionElement = document.getElementById("peeping-tom-selection");
  if (!selectionElement) return;
  
  // Calculate width and height of selection
  const width = e.clientX - selectionStart.x;
  const height = e.clientY - selectionStart.y;
  
  // Update selection element size
  selectionElement.style.width = `${Math.abs(width)}px`;
  selectionElement.style.height = `${Math.abs(height)}px`;
  
  // Adjust position if selecting in negative direction
  if (width < 0) {
    selectionElement.style.left = `${e.clientX}px`;
  }
  if (height < 0) {
    selectionElement.style.top = `${e.clientY}px`;
  }
}

function handleSelectionEnd(e) {
  if (!selecting || !selectionStart) return;
  
  e.preventDefault();
  
  // Clean up selection mode
  selecting = false;
  document.body.style.cursor = "default";
  
  // Remove all event listeners
  document.removeEventListener("mousedown", handleSelectionStart, { capture: true });
  document.removeEventListener("mousemove", handleSelectionMove, { capture: true });
  document.removeEventListener("mouseup", handleSelectionEnd, { capture: true });
  document.removeEventListener("keydown", handleEscapeKey, { capture: true });
  
  // Get final selection dimensions
  const selectionElement = document.getElementById("peeping-tom-selection");
  if (!selectionElement) return;
  
  const selection = {
    left: parseInt(selectionElement.style.left),
    top: parseInt(selectionElement.style.top),
    width: parseInt(selectionElement.style.width),
    height: parseInt(selectionElement.style.height)
  };
  
  // Remove selection element
  document.body.removeChild(selectionElement);
  
  // Process the selected area
  processSelection(selection);
}

function handleEscapeKey(e) {
  if (e.key === "Escape") {
    if (overlay) {
      showStudyMessage();
    } else if (selecting) {
      cancelSelection();
    }
  }
}

function cancelSelection() {
  selecting = false;
  selectionStart = null;
  document.body.style.cursor = "default";
  
  // Remove all event listeners
  document.removeEventListener("mousedown", handleSelectionStart, { capture: true });
  document.removeEventListener("mousemove", handleSelectionMove, { capture: true });
  document.removeEventListener("mouseup", handleSelectionEnd, { capture: true });
  document.removeEventListener("keydown", handleEscapeKey, { capture: true });
  
  const selectionElement = document.getElementById("peeping-tom-selection");
  if (selectionElement) {
    document.body.removeChild(selectionElement);
  }
}

function processSelection(selection) {
  // Create overlay near the selection
  createOverlay(selection);
  
  // Show loading spinner
  showLoading();
  
  // Capture the selected area
  captureSelection(selection)
    .then(image => sendToGeminiAPI(image))
    .then(response => {
      showAnswer(response);
    })
    .catch(error => {
      console.error("Processing error:", error);
      showError("could not send query");
    });
}

function createOverlay(selection) {
  // Remove any existing overlay
  if (overlay) {
    document.body.removeChild(overlay);
  }
  
  // Create new overlay
  overlay = document.createElement("div");
  overlay.id = "peeping-tom-overlay";
  overlay.style.position = "fixed";
  overlay.style.width = "300px";
  overlay.style.backgroundColor = "rgba(255, 255, 255, 0.95)";
  overlay.style.border = "1px solid #ccc";
  overlay.style.borderRadius = "5px";
  overlay.style.boxShadow = "0 2px 10px rgba(0,0,0,0.1)";
  overlay.style.zIndex = "10001";
  overlay.style.padding = "15px";
  overlay.style.maxHeight = "400px";
  overlay.style.overflowY = "auto";
  overlay.style.fontFamily = "Arial, sans-serif";
  
  // Position near selection
  overlay.style.left = `${selection.left + selection.width + 10}px`;
  overlay.style.top = `${selection.top}px`;
  
  // Adjust position if it would go off screen
  const rightEdge = selection.left + selection.width + 320;
  if (rightEdge > window.innerWidth) {
    overlay.style.left = `${selection.left - 310}px`;
  }
  
  document.body.appendChild(overlay);
}

function showLoading() {
  isProcessing = true;
  overlay.innerHTML = `
    <div style="text-align:center; padding: 20px;">
      <div class="loading-spinner"></div>
      <p>Processing</p>
    </div>
  `;
}

function showAnswer(response) {
  isProcessing = false;
  overlay.innerHTML = `
    <div style="padding: 10px;">
      <h3 style="margin-top: 0; color: #333; border-bottom: 1px solid #eee; padding-bottom: 10px;">Answer</h3>
      <p>${response.answer}</p>
      <h3 style="color: #333; border-bottom: 1px solid #eee; padding-bottom: 10px;">Explanation</h3>
      <p>${response.explanation}</p>
    </div>
  `;
}

function showError(message) {
  isProcessing = false;
  overlay.innerHTML = `
    <div style="padding: 10px;">
      <h3 style="margin-top: 0; color: #333; border-bottom: 1px solid #eee; padding-bottom: 10px;">Error</h3>
      <p>${message}</p>
    </div>
  `;
}

function showStudyMessage() {
  if (!overlay) return;
  
  const studyMessage = document.createElement("div");
  studyMessage.id = "study-message";
  studyMessage.style.position = "fixed";
  studyMessage.style.left = overlay.style.left;
  studyMessage.style.top = overlay.style.top;
  studyMessage.style.backgroundColor = "rgba(255, 255, 255, 0.95)";
  studyMessage.style.padding = "15px";
  studyMessage.style.borderRadius = "5px";
  studyMessage.style.boxShadow = "0 2px 10px rgba(0,0,0,0.1)";
  studyMessage.style.zIndex = "10001";
  studyMessage.style.fontFamily = "Arial, sans-serif";
  studyMessage.innerHTML = "<p>please study harder so u dont need me anymore</p>";
  
  document.body.removeChild(overlay);
  overlay = null;
  document.body.appendChild(studyMessage);
  
  // Remove after 5 seconds
  setTimeout(() => {
    if (document.body.contains(studyMessage)) {
      document.body.removeChild(studyMessage);
    }
  }, 5000);
}

// Modified function to handle image capture
async function captureSelection(selection) {
  try {
    // Send message to background script to capture the screen
    return browser.runtime.sendMessage({
      action: "captureScreen",
      selection: selection
    }).then(imageData => {
      if (!imageData) {
        throw new Error("Failed to capture screenshot");
      }
      return imageData;
    }).catch(error => {
      console.error("Screenshot capture error:", error);
      
      // Fallback method - create a canvas and try to capture what's visible
      const canvas = document.createElement('canvas');
      canvas.width = selection.width;
      canvas.height = selection.height;
      
      const ctx = canvas.getContext('2d');
      
      // Create a temporary image from the visible content
      const tempImage = new Image();
      tempImage.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="' + window.innerWidth + '" height="' + window.innerHeight + '"><foreignObject width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml">' + document.documentElement.innerHTML + '</div></foreignObject></svg>');
      
      return new Promise((resolve, reject) => {
        tempImage.onload = function() {
          ctx.drawImage(tempImage, selection.left, selection.top, selection.width, selection.height, 0, 0, selection.width, selection.height);
          resolve(canvas.toDataURL('image/png'));
        };
        tempImage.onerror = function(e) {
          reject(new Error("Failed to create image capture: " + e));
        };
      });
    });
  } catch (error) {
    console.error('Error capturing selection:', error);
    throw error;
  }
}

async function sendToGeminiAPI(imageData) {
  try {
    console.log("Sending data to Gemini API");
    
    //insert own api key
    //const API_KEY = '';
    const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
    
    // Extract the base64 data from the imageData object
    const base64Data = imageData.imageData.includes('base64,') ? 
      imageData.imageData.split('base64,')[1] : imageData.imageData;
    
    const payload = {
      contents: [{
        parts: [
          {
            text: "This is a quiz question. Please provide: 1) The direct answer and 2) A brief explanation. Format your response with two sections: 'Answer:' and 'Explanation:'"
          },
          {
            inline_data: {
              mime_type: "image/png",
              data: base64Data
            }
          }
        ]
      }],
      generationConfig: {
        temperature: 0.4,
        topK: 32,
        topP: 1,
        maxOutputTokens: 4096,
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        }
      ]
    };
    
    const response = await fetch(`${API_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('API Error Response:', errorData);
      throw new Error(`API request failed with status ${response.status}: ${JSON.stringify(errorData)}`);
    }
    
    const data = await response.json();
    
    // Process the Gemini response
    if (data.candidates && data.candidates[0].content && data.candidates[0].content.parts) {
      const text = data.candidates[0].content.parts[0].text;
      
      // Parse response text to extract answer and explanation
      const answerMatch = text.match(/Answer:(.*?)(?=Explanation:|$)/s);
      const explanationMatch = text.match(/Explanation:(.*)/s);
      
      return {
        answer: answerMatch ? answerMatch[1].trim() : "I honestly don't know",
        explanation: explanationMatch ? explanationMatch[1].trim() : "No explanation provided."
      };
    } else {
      throw new Error("Invalid response format");
    }
  } catch (error) {
    console.error('Error sending to Gemini API:', error);
    throw error;
  }
}
