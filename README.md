# Peeping Tom Extension


https://github.com/user-attachments/assets/9a4e66c6-4560-4fd9-84e2-d65463f62ffc


A browser extension that helps users understand quiz questions by providing answers and explanations using Google's Gemini AI.

## Features

- **Smart Selection**: Select any quiz question on a webpage to get instant answers
- **AI-Powered Analysis**: Uses Google's Gemini AI to analyze questions and provide accurate answers
- **Detailed Explanations**: Get not just answers but also explanations to help understand the concepts
- **Keyboard Shortcuts**: Quick activation using Alt+I keyboard shortcut
- **User-Friendly Interface**: Clean and intuitive overlay for displaying answers

## Installation

1. Clone this repository or download the source code
2. Open your browser and navigate to the extensions page:
   - Chrome: `chrome://extensions/`
   - Firefox: `about:addons`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the extension directory

## Usage

1. **Activation**:
   - Click the extension icon in your browser toolbar
   - Click "Start Selection" button
   - Or use the keyboard shortcut Alt+I

2. **Selection**:
   - Click and drag to select the quiz question area
   - The selection will be highlighted with a blue border

3. **Results**:
   - An overlay will appear showing the answer and explanation
   - The overlay can be closed by clicking outside or pressing Escape

## Technical Details

### File Structure

```
peeping_tom_extension/
├── manifest.json          # Extension configuration
├── background.js          # Background script for screen capture
├── content.js            # Content script for selection and UI
├── popup.html            # Extension popup interface
├── popup.js              # Popup script logic
├── styles.css            # Styling for the extension
└── icons/                # Extension icons
    ├── icon-16.png
    ├── icon-32.png
    └── icon-48.png
```

### Key Components

1. **Content Script (`content.js`)**:
   - Handles selection mode activation
   - Manages mouse events for selection
   - Creates and displays the overlay
   - Communicates with background script for screen capture
   - Sends data to Gemini API

2. **Background Script (`background.js`)**:
   - Handles screen capture requests
   - Manages keyboard shortcuts
   - Handles extension installation and updates

3. **Popup Interface (`popup.html` and `popup.js`)**:
   - Provides user interface for extension activation
   - Shows extension status and controls

## API Integration

The extension uses Google's Gemini AI API for question analysis:

1. **API Configuration**:
   - Uses the `gemini-1.5-flash` model
   - Implements proper error handling
   - Includes safety settings for content filtering

2. **Request Format**:
   - Sends both text and image data
   - Includes generation configuration
   - Implements proper error handling

## Development

### Prerequisites

- Modern web browser (Chrome or Firefox)
- Basic understanding of JavaScript
- Google Gemini API key

### Setup

1. Clone the repository
2. Install dependencies (if any)
3. Update the API key in `content.js`
4. Load the extension in your browser

### Testing

1. Load the extension in developer mode
2. Test selection on various types of content
3. Check API integration and response handling

## Security Considerations

1. **API Key Protection**:
   - API key is stored in the code
   - Consider implementing secure storage in production

2. **User Privacy**:
   - No data collection
   - No tracking
   - Local processing where possible

## Limitations

1. **API Dependencies**:
   - Requires valid Gemini API key
   - Subject to API rate limits
   - Requires internet connection

2. **Content Restrictions**:
   - Limited to visible content
   - May not work on all websites

3. **Technical Limitations**:
   - Browser compatibility
   - Performance on complex pages
   - Selection accuracy

## Future Improvements

1. **Features**:
   - Settings page for API key management
   - Multiple language support
   - History of previous questions
   - Export functionality

2. **Technical**:
   - Improved error handling
   - Better performance optimization
   - Offline capabilities


## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## Support

For issues and feature requests, please open an issue in the repository.
![Peeping Tom icon](https://github.com/user-attachments/assets/fbfbc007-cfe6-4b11-8562-9bce56dcf079)
