# OBS Virtual Camera Assistant

This is an Electron-based OBS Virtual Camera display tool that supports automatic detection of OBS virtual camera, video streaming display, resolution adjustment, and other features.

## Project Structure

The project adopts a modular architecture with code layered by function to improve maintainability and scalability.

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
└── README.md           # Project documentation
```

## Features

- 📷 Automatically detect OBS virtual camera
- 📺 Display real-time camera video stream
- 📐 Support multiple preset resolutions and custom resolutions
- 🖱️ Double-click to switch fullscreen display
- 📊 Show current video resolution information
- 🎯 Window automatically adapts to video size
- ❓ Provide help for camera access issues

## Module Description

1. **StatusModule**: Manages application status display and permission help popups
2. **CameraModule**: Handles camera device acquisition, video stream connection and management
3. **ResolutionModule**: Responsible for resolution selection, display and window size adjustment
4. **UIModule**: Handles UI interaction, page visibility changes and camera connection status checks

## Development Environment Setup

1. Ensure Node.js and npm are installed
2. Clone the project code
3. Install dependencies: `npm install`
4. Start development server: `npm start`
5. Build application: `npm run dist`

## Usage

1. Ensure OBS virtual camera is started
2. Run the application, it will automatically try to connect to OBS virtual camera
3. If connection fails, you can manually select the camera from the device list
4. You can choose preset resolutions or enter custom resolutions
5. Hover the mouse over the window to display control buttons and resolution information
6. Double-click the video area to switch fullscreen mode

## Notes

- The application requires camera access permissions
- If you cannot access the camera, please check system permission settings
- On Windows, you may need to run the application as administrator

## License

MPL-2.0 License

---

[中文版本](docs/README_zh.md)