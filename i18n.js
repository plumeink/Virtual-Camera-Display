// i18n模块 - 处理国际化
const i18n = {
    currentLang: 'zh', // 默认语言为中文
    translations: {},
    initialized: false,
    observer: null,

    // 初始化i18n
    async init() {
        try {
            // 立即显示加载状态，避免空白
            this.updateLoadingStatus();
            
            // 检测系统语言
            this.detectSystemLanguage();
            
            // 加载当前语言的翻译文件
            await this.loadLanguage(this.currentLang);
            
            // 初始化完成
            this.initialized = true;
            
            // 翻译页面上的所有文本
            this.translatePage();
            
            // 设置语言切换下拉菜单
            this.setupLanguageDropdown();
            
            // 设置DOM变化监听，用于翻译动态添加的元素
            this.setupDOMObserver();
            
            console.log(`i18n initialized with language: ${this.currentLang}`);
        } catch (error) {
            console.error('i18n initialization failed:', error);
            // 即使初始化失败，也尝试显示基本的加载状态
            this.updateLoadingStatus(true);
        }
    },
    
    // 更新加载状态文本
    updateLoadingStatus(isError = false) {
        const statusElement = document.getElementById('status');
        if (statusElement) {
            // 即使还未完全初始化，也尝试显示基本的加载文本
            statusElement.textContent = isError ? '初始化i18n失败' : '初始化中...';
        }
    },

    // 检测系统语言
    detectSystemLanguage() {
        // 检查localStorage中是否有保存的语言设置
        const savedLang = localStorage.getItem('appLanguage');
        if (savedLang && (savedLang === 'zh' || savedLang === 'en')) {
            this.currentLang = savedLang;
            return;
        }

        // 获取浏览器/系统语言
        const browserLang = navigator.language || navigator.userLanguage;
        
        // 中文语言系统使用中文，其他使用英文
        this.currentLang = browserLang.includes('zh') ? 'zh' : 'en';
    },

    // 加载指定语言的翻译文件
    async loadLanguage(lang) {
        try {
            const response = await fetch(`lang/${lang}.json`);
            if (!response.ok) {
                throw new Error(`Failed to load language file: ${lang}`);
            }
            
            this.translations[lang] = await response.json();
            
            // 缓存语言设置到localStorage
            localStorage.setItem('appLanguage', lang);
            
            // 更新当前语言
            this.currentLang = lang;
        } catch (error) {
            console.error(`Error loading language ${lang}:`, error);
            // 如果加载失败，尝试使用备用语言
            if (lang === 'zh') {
                await this.loadLanguage('en');
            } else {
                await this.loadLanguage('zh');
            }
        }
    },

    // 获取翻译文本
    t(key, ...params) {
        if (!this.initialized) {
            return key; // 如果还未初始化，返回原始键名
        }

        const translation = this.translations[this.currentLang]?.[key];
        if (!translation) {
            console.warn(`Translation missing for key: ${key} in language: ${this.currentLang}`);
            return key;
        }

        // 处理带参数的翻译
        let result = translation;
        params.forEach((param, index) => {
            result = result.replace(`{${index}}`, param);
        });

        return result;
    },

    // 切换语言
    async changeLanguage(lang) {
        if (lang === this.currentLang) {
            return; // 已经是目标语言，无需切换
        }

        // 加载新语言
        await this.loadLanguage(lang);
        
        // 重新翻译页面
        this.translatePage();
        
        console.log(`Language changed to: ${lang}`);
    },

    // 翻译整个页面
    translatePage() {
        // 翻译带有data-i18n属性的元素
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (key) {
                // 根据元素类型设置不同的属性
                if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') {
                    if (el.getAttribute('placeholder')) {
                        el.setAttribute('placeholder', this.t(key));
                    } else {
                        el.value = this.t(key);
                    }
                } else if (el.tagName === 'TITLE') {
                    document.title = this.t(key);
                } else if (el.tagName === 'OPTION') {
                    el.textContent = this.t(key);
                } else if (el.hasAttribute('alt')) {
                    el.setAttribute('alt', this.t(key));
                } else if (el.hasAttribute('title')) {
                    el.setAttribute('title', this.t(key));
                } else {
                    el.textContent = this.t(key);
                }
            }
        });
        
        // 特殊处理：确保分辨率选择器的自动检测选项已翻译
        const autoDetectOption = document.querySelector('#presetResolution option[value="auto"]');
        if (autoDetectOption && autoDetectOption.hasAttribute('data-i18n')) {
            const key = autoDetectOption.getAttribute('data-i18n');
            autoDetectOption.textContent = this.t(key);
        }
    },

    // 设置语言切换下拉菜单
    setupLanguageDropdown() {
        console.log('Setting up language dropdown...');
        let languageDropdown = document.getElementById('languageDropdown');
        
        // 如果下拉菜单不存在，创建一个新的
        if (!languageDropdown) {
            console.log('Creating new language dropdown...');
            // 创建语言选择器
            languageDropdown = document.createElement('select');
            languageDropdown.id = 'languageDropdown';
            languageDropdown.className = 'control-btn no-drag';
            languageDropdown.style.padding = '4px 8px';
            languageDropdown.style.marginLeft = '10px';
            languageDropdown.style.border = 'none';
            languageDropdown.style.background = 'rgba(0, 0, 0, 0.7)';
            languageDropdown.style.color = 'white';
            languageDropdown.style.cursor = 'pointer';
            languageDropdown.style.fontSize = '12px';
            
            // 添加到控制按钮区域
            const controls = document.getElementById('controls');
            console.log('Controls element found:', !!controls);
            
            if (controls) {
                controls.appendChild(languageDropdown);
                console.log('Language dropdown added to controls');
            } else {
                console.warn('Controls element not found! Trying to add to body as fallback...');
                // 如果controls元素不存在，尝试添加到body
                document.body.appendChild(languageDropdown);
                // 调整样式以确保可见
                languageDropdown.style.position = 'fixed';
                languageDropdown.style.top = '10px';
                languageDropdown.style.right = '10px';
                languageDropdown.style.zIndex = '9999';
            }
        } else {
            console.log('Language dropdown already exists');
        }
        
        // 清空现有选项
        languageDropdown.innerHTML = '';
        
        // 添加中文选项 - 显示对应语言的文本
        const chineseOption = document.createElement('option');
        chineseOption.value = 'zh';
        chineseOption.textContent = this.t('chineseOption'); // 使用翻译文本显示
        chineseOption.selected = this.currentLang === 'zh';
        languageDropdown.appendChild(chineseOption);
        
        // 添加英文选项 - 显示对应语言的文本
        const englishOption = document.createElement('option');
        englishOption.value = 'en';
        englishOption.textContent = this.t('englishOption'); // 使用翻译文本显示
        englishOption.selected = this.currentLang === 'en';
        languageDropdown.appendChild(englishOption);
        
        // 添加语言切换事件监听
        languageDropdown.addEventListener('change', (e) => {
            this.changeLanguage(e.target.value);
        });
    },

    // 设置DOM变化监听
    setupDOMObserver() {
        // 创建一个MutationObserver实例来监听DOM变化
        this.observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                // 检查是否有新的元素被添加
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    // 翻译新添加的元素
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // 检查节点本身是否需要翻译
                            if (node.hasAttribute('data-i18n')) {
                                const key = node.getAttribute('data-i18n');
                                node.textContent = this.t(key);
                            }
                            
                            // 检查子节点是否需要翻译
                            node.querySelectorAll('[data-i18n]').forEach((child) => {
                                const key = child.getAttribute('data-i18n');
                                child.textContent = this.t(key);
                            });
                        }
                    });
                }
            });
        });
        
        // 配置观察选项
        const config = {
            childList: true,
            subtree: true
        };
        
        // 开始观察document.body
        this.observer.observe(document.body, config);
    },

    // 清理i18n资源
    cleanup() {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
    }
};

// 导出i18n对象
export default i18n;