# Virtual Camera Assistant

[中文文档](docs/README_zh.md)

## Project Introduction

This is a specialized Electron-based application designed to solve a common problem in live streaming workflows: **providing a virtual camera capture method for streaming scenarios where traditional window capture is not sufficient or convenient**. The tool creates a borderless window that displays the virtual camera feed, making it easier to integrate virtual camera sources into various streaming software.

## Project Purpose

The primary motivation behind this project is to address the limitations of traditional window capture methods in live streaming. When using virtual cameras, it can be challenging to capture the virtual camera feed directly in some streaming applications. This tool bridges that gap by providing a dedicated display window that can be easily captured by any streaming software that supports window capture.

## Key Features

- **🎯 Automatic Virtual Camera Detection**: Smartly identifies and connects to virtual cameras using keyword matching
- **🖼️ Borderless Display**: Creates a clean, borderless window optimized for capturing by streaming software
- **📐 Flexible Resolution Support**: Offers multiple preset resolutions and custom resolution input
- **🖱️ Intuitive Controls**: Double-click to toggle fullscreen mode, mouse hover to reveal control buttons
- **🔄 Auto-adaptive Window**: Window size automatically adjusts to match the video stream dimensions
- **🔍 Resolution Information**: Displays current video resolution for reference
- **❓ Troubleshooting Assistance**: Provides help for camera access issues

## Download

You can download the latest release of the application from the GitHub repository:

[🔗 Download Latest Release](https://github.com/plumeink/Virtual-Camera-Assistant/releases/latest)

## Project Structure

The project adopts a modular architecture to enhance maintainability and scalability:

```
├── src/                # Source code directory
│   ├── assets/         # Static resources (CSS styles)
│   ├── modules/        # Functional modules
│   │   ├── status.js   # Status management module
│   │   ├── camera.js   # Camera management module
│   │   ├── resolution.js # Resolution management module
│   │   └── ui.js       # UI interaction module
│   ├── index.html      # Main HTML file
│   └── main.js         # Application main entry file
├── index.js            # Electron main process file
├── preload.js          # Electron preload script
├── package.json        # Project configuration and dependencies
├── lang/               # Language files for internationalization
└── README.md           # Project documentation
```

## Module Description

1. **StatusModule**: Manages application status display and permission help popups
2. **CameraModule**: Handles camera device acquisition, video stream connection and management
3. **ResolutionModule**: Responsible for resolution selection, display and window size adjustment
4. **UIModule**: Handles UI interaction, page visibility changes and camera connection status checks

## Development Environment Setup

1. Ensure Node.js and npm are installed on your system
2. Clone the project repository
3. Install dependencies: `npm install`
4. Start the development server: `npm start`
5. Build the application: `npm run dist`
6. Create a portable build: `npm run dist-portable`

## Usage

1. Ensure your virtual camera is active
2. Launch the application - it will automatically attempt to connect to your virtual camera
3. If automatic connection fails, manually select the camera from the device dropdown list
4. Choose from preset resolutions or enter custom dimensions as needed
5. Hover your mouse over the window to reveal control buttons and resolution information
6. Double-click the video area to toggle fullscreen mode
7. Use your streaming software to capture this application window

## Notes

- The application requires camera access permissions to function correctly
- If you encounter issues accessing the camera, please check your system permission settings
- On Windows, you may need to run the application with administrator privileges
- The tool is primarily designed for use with virtual cameras, but can also display feeds from physical cameras

## License

MPL-2.0 License