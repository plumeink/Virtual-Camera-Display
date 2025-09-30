// Language resource object - Loaded from JSON files
let languageResources = {
    // Default empty object, will be loaded from JSON files at runtime
};

// Language resource loading status
let resourcesLoaded = false;

// Promise for language resource loading
let resourcesLoadPromise = null;

// Load language resources from JSON files
async function loadLanguageResources() {
    // If resources are already loaded, return directly
    if (resourcesLoaded) {
        return Promise.resolve();
    }
    
    // If loading is in progress, return the existing Promise
    if (resourcesLoadPromise) {
        return resourcesLoadPromise;
    }
    
    // Create new loading Promise
    resourcesLoadPromise = new Promise(async (resolve, reject) => {
        try {
            // List of supported languages
            const supportedLanguages = ['zh', 'en'];
            
            // Load all supported language resources
            for (const langCode of supportedLanguages) {
                try {
                    // 构建JSON文件路径
                    const filePath = `lang/${langCode}.json`;
                    
                    // 尝试加载JSON文件
                    let response;
                    
                    // Use fs module to load local files in Electron environment
                    if (typeof window !== 'undefined' && window.process && window.process.type === 'renderer') {
                        // Electron renderer process
                        const fs = require('fs');
                        const path = require('path');
                        const fullPath = path.join(__dirname, filePath);
                        
                        if (fs.existsSync(fullPath)) {
                            const fileContent = fs.readFileSync(fullPath, 'utf8');
                            languageResources[langCode] = JSON.parse(fileContent);
                        } else {
                            console.warn(`Language file not found: ${fullPath}`);
                        }
                    } else {
                        // 网页环境
                        response = await fetch(filePath);
                        if (response.ok) {
                            languageResources[langCode] = await response.json();
                        } else {
                            console.warn(`Failed to load language file: ${filePath}`);
                        }
                    }
                } catch (error) {
                    console.error(`Error loading language resource for ${langCode}:`, error);
                }
            }
            
            // If no language resources were loaded, use minimal fallback resources
            if (Object.keys(languageResources).length === 0) {
                console.warn('No language resources loaded, using minimal fallback resources.');
                languageResources = {
                    'zh': {
                        'appTitle': '虚拟摄像头显示',
                        'loading': '加载中...'
                    },
                    'en': {
                        'appTitle': 'Virtual Camera Display',
                        'loading': 'Loading...'
                    }
                };
            }
            
            resourcesLoaded = true;
            resolve();
        } catch (error) {
            console.error('Error loading language resources:', error);
            reject(error);
        }
    });
    
    return resourcesLoadPromise;
}

// Ensure language resources are loaded
async function ensureResourcesLoaded() {
    if (!resourcesLoaded) {
        await loadLanguageResources();
    }
}

// Detect system language and return language code
function detectSystemLanguage() {
    // 获取系统语言首两位代码（zh, en等）
    const systemLang = navigator.language || navigator.userLanguage;
    const langCode = systemLang.substring(0, 2).toLowerCase();
    
    // Return 'zh' for Chinese environment, 'en' for others
    return langCode === 'zh' ? 'zh' : 'en';
}

// Current language code
let currentLanguage = detectSystemLanguage();

// Initialize language resources
async function initLanguageResources() {
    try {
        await loadLanguageResources();
        // 确保当前语言是有效的
        if (!languageResources[currentLanguage]) {
            console.warn(`Current language '${currentLanguage}' not supported, switching to 'en'`);
            currentLanguage = 'en';
        }
    } catch (error) {
        console.error('Error initializing language resources:', error);
    }
}

// Initialize language resources (immediate execution)
initLanguageResources();

// Function to switch language (optional feature)
export async function setLanguage(langCode) {
    await ensureResourcesLoaded();
    if (languageResources[langCode]) {
        currentLanguage = langCode;
        return true;
    }
    return false;
}

// Function to get resources for current language - Async version
export async function getText(key) {
    await ensureResourcesLoaded();
    return languageResources[currentLanguage]?.[key] || key;
}

// Function to get resources for current language - Sync version (may return key name if resources are not loaded)
export function getTextSync(key) {
    return languageResources[currentLanguage]?.[key] || key;
}

// Get current language code
export function getCurrentLanguage() {
    return currentLanguage;
}

// Export language resource loading functions for external calls
export { loadLanguageResources, ensureResourcesLoaded };