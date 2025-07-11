/**
 * Accessibility Service for Visually Impaired Users
 * Provides comprehensive accessibility features including screen reader support,
 * high contrast modes, keyboard navigation, and text-to-speech functionality
 */

export interface AccessibilitySettings {
  highContrast: boolean;
  largeText: boolean;
  reduceMotion: boolean;
  screenReader: boolean;
  keyboardNavigation: boolean;
  voiceGuidance: boolean;
  textToSpeech: boolean;
  focusIndicators: boolean;
  colorBlindSupport: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  announcements: boolean;
}

export const defaultAccessibilitySettings: AccessibilitySettings = {
  highContrast: false,
  largeText: false,
  reduceMotion: false,
  screenReader: false,
  keyboardNavigation: true,
  voiceGuidance: false,
  textToSpeech: false,
  focusIndicators: true,
  colorBlindSupport: false,
  fontSize: 'medium',
  announcements: true,
};

class AccessibilityService {
  private settings: AccessibilitySettings;
  private announcer: HTMLElement | null = null;
  private speechSynthesis: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private listeners: Map<string, ((key: string, value: unknown) => void)[]> = new Map();

  constructor() {
    this.settings = this.loadSettings();
    this.init();
  }

  private init() {
    this.createLiveRegion();
    this.initSpeechSynthesis();
    this.setupKeyboardNavigation();
    this.applySettings();
    this.detectScreenReader();
  }

  /**
   * Create ARIA live region for screen reader announcements
   */
  private createLiveRegion() {
    if (typeof document === 'undefined') return;

    this.announcer = document.createElement('div');
    this.announcer.setAttribute('aria-live', 'polite');
    this.announcer.setAttribute('aria-atomic', 'true');
    this.announcer.setAttribute('id', 'accessibility-announcer');
    this.announcer.style.cssText = `
      position: absolute;
      left: -10000px;
      top: auto;
      width: 1px;
      height: 1px;
      overflow: hidden;
    `;
    document.body.appendChild(this.announcer);
  }

  /**
   * Initialize text-to-speech functionality
   */
  private initSpeechSynthesis() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.speechSynthesis = window.speechSynthesis;
    }
  }

  /**
   * Detect if screen reader is being used
   */
  private detectScreenReader() {
    if (typeof window === 'undefined') return;

    // Check for common screen reader indicators
    const hasAriaLive = document.querySelector('[aria-live]');
    const hasAriaLabel = document.querySelector('[aria-label]');
    const hasAriaDescribedBy = document.querySelector('[aria-describedby]');
    
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (hasAriaLive || hasAriaLabel || hasAriaDescribedBy || prefersReducedMotion) {
      this.updateSetting('screenReader', true);
      this.updateSetting('announcements', true);
    }
  }

  /**
   * Setup enhanced keyboard navigation
   */
  private setupKeyboardNavigation() {
    if (typeof document === 'undefined') return;

    // Enhanced tab navigation
    document.addEventListener('keydown', (e) => {
      if (!this.settings.keyboardNavigation) return;

      switch (e.key) {
        case 'Tab':
          this.handleTabNavigation(e);
          break;
        case 'Escape':
          this.handleEscapeKey();
          break;
        case 'Enter':
        case ' ':
          this.handleActivation(e);
          break;
        case 'ArrowUp':
        case 'ArrowDown':
        case 'ArrowLeft':
        case 'ArrowRight':
          this.handleArrowNavigation(e);
          break;
        case 'Home':
        case 'End':
          this.handleHomeEndNavigation(e);
          break;
      }
    });

    // Focus management
    document.addEventListener('focusin', (e) => {
      this.handleFocusIn(e);
    });
  }

  /**
   * Handle tab navigation with enhanced features
   */
  private handleTabNavigation(e: KeyboardEvent) {
    const focusableElements = this.getFocusableElements();
    const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);
    
    if (e.shiftKey) {
      // Shift+Tab (backward)
      if (currentIndex <= 0) {
        e.preventDefault();
        focusableElements[focusableElements.length - 1]?.focus();
      }
    } else {
      // Tab (forward)
      if (currentIndex >= focusableElements.length - 1) {
        e.preventDefault();
        focusableElements[0]?.focus();
      }
    }
  }

  /**
   * Get all focusable elements in correct tab order
   */
  private getFocusableElements(): HTMLElement[] {
    if (typeof document === 'undefined') return [];

    const selector = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[role="button"]:not([disabled])',
      '[role="link"]:not([disabled])',
      '[contenteditable="true"]'
    ].join(', ');

    return Array.from(document.querySelectorAll(selector)) as HTMLElement[];
  }

  /**
   * Handle escape key to close modals/menus
   */
  private handleEscapeKey() {
    const activeElement = document.activeElement as HTMLElement;
    const modal = activeElement?.closest('[role="dialog"], .MuiDialog-root');
    const menu = activeElement?.closest('[role="menu"], .MuiMenu-root');
    
    if (modal || menu) {
      // Find close button or trigger escape event
      const closeButton = modal?.querySelector('[aria-label*="close"], [aria-label*="סגור"]') as HTMLElement;
      if (closeButton) {
        closeButton.click();
      }
    }
  }

  /**
   * Handle activation of focused elements
   */
  private handleActivation(e: KeyboardEvent) {
    const target = e.target as HTMLElement;
    if (target.role === 'button' || target.closest('[role="button"]')) {
      e.preventDefault();
      target.click();
    }
  }

  /**
   * Handle arrow key navigation
   */
  private handleArrowNavigation(e: KeyboardEvent) {
    const target = e.target as HTMLElement;
    const menu = target.closest('[role="menu"]');
    const listbox = target.closest('[role="listbox"]');
    const grid = target.closest('[role="grid"]');

    if (menu || listbox) {
      this.handleListNavigation(e, target);
    } else if (grid) {
      this.handleGridNavigation(e, target);
    }
  }

  /**
   * Handle list/menu navigation with arrow keys
   */
  private handleListNavigation(e: KeyboardEvent, target: HTMLElement) {
    const container = target.closest('[role="menu"], [role="listbox"]');
    if (!container) return;

    const items = Array.from(container.querySelectorAll('[role="menuitem"], [role="option"]')) as HTMLElement[];
    const currentIndex = items.indexOf(target);

    let nextIndex: number;
    if (e.key === 'ArrowDown') {
      nextIndex = (currentIndex + 1) % items.length;
    } else if (e.key === 'ArrowUp') {
      nextIndex = currentIndex <= 0 ? items.length - 1 : currentIndex - 1;
    } else {
      return;
    }

    e.preventDefault();
    items[nextIndex]?.focus();
  }

  /**
   * Handle grid navigation with arrow keys
   */
  private handleGridNavigation(e: KeyboardEvent, target: HTMLElement) {
    // Implementation for data grid navigation
    const cell = target.closest('[role="gridcell"]');
    if (!cell) return;

    // DataGrid specific navigation would be handled here
    // This is a simplified version
    e.preventDefault();
  }

  /**
   * Handle home/end navigation
   */
  private handleHomeEndNavigation(e: KeyboardEvent) {
    const target = e.target as HTMLElement;
    const container = target.closest('[role="menu"], [role="listbox"], [role="grid"]');
    
    if (container) {
      e.preventDefault();
      const items = Array.from(container.querySelectorAll('[role="menuitem"], [role="option"], [role="gridcell"]')) as HTMLElement[];
      
      if (e.key === 'Home') {
        items[0]?.focus();
      } else if (e.key === 'End') {
        items[items.length - 1]?.focus();
      }
    }
  }

  /**
   * Handle focus events for announcements
   */
  private handleFocusIn(e: FocusEvent) {
    const target = e.target as HTMLElement;
    
    if (this.settings.voiceGuidance) {
      this.announceElement(target);
    }

    if (this.settings.focusIndicators) {
      this.enhanceFocusIndicator(target);
    }
  }

  /**
   * Announce element information to screen readers
   */
  announceElement(element: HTMLElement) {
    if (!this.settings.announcements || !element) return;

    const announcement = this.getElementAnnouncement(element);
    if (announcement) {
      this.announce(announcement);
    }
  }

  /**
   * Get appropriate announcement text for element
   */
  private getElementAnnouncement(element: HTMLElement): string {
    const role = element.getAttribute('role');
    const ariaLabel = element.getAttribute('aria-label');
    const ariaLabelledBy = element.getAttribute('aria-labelledby');
    const tagName = element.tagName.toLowerCase();
    
    let announcement = '';

    // Get label text
    if (ariaLabel) {
      announcement = ariaLabel;
    } else if (ariaLabelledBy) {
      const labelElement = document.getElementById(ariaLabelledBy);
      announcement = labelElement?.textContent || '';
    } else {
      announcement = element.textContent?.trim() || '';
    }

    // Add role information
    const roleText = this.getRoleAnnouncement(role || tagName);
    if (roleText) {
      announcement += `, ${roleText}`;
    }

    // Add state information
    const stateText = this.getStateAnnouncement(element);
    if (stateText) {
      announcement += `, ${stateText}`;
    }

    return announcement.trim();
  }

  /**
   * Get role announcement in Hebrew/English
   */
  private getRoleAnnouncement(role: string): string {
    const roleMap: Record<string, { he: string; en: string }> = {
      button: { he: 'כפתור', en: 'button' },
      link: { he: 'קישור', en: 'link' },
      textbox: { he: 'תיבת טקסט', en: 'text field' },
      input: { he: 'שדה קלט', en: 'input field' },
      checkbox: { he: 'תיבת סימון', en: 'checkbox' },
      radio: { he: 'כפתור בחירה', en: 'radio button' },
      menu: { he: 'תפריט', en: 'menu' },
      menuitem: { he: 'פריט תפריט', en: 'menu item' },
      dialog: { he: 'דיאלוג', en: 'dialog' },
      tab: { he: 'לשונית', en: 'tab' },
      grid: { he: 'טבלה', en: 'table' },
      heading: { he: 'כותרת', en: 'heading' },
    };

    const roleInfo = roleMap[role];
    if (!roleInfo) return '';

    // Get current language from settings or default to Hebrew
    const isHebrew = document.documentElement.dir === 'rtl';
    return isHebrew ? roleInfo.he : roleInfo.en;
  }

  /**
   * Get state announcement (disabled, expanded, etc.)
   */
  private getStateAnnouncement(element: HTMLElement): string {
    const states: string[] = [];
    const isHebrew = document.documentElement.dir === 'rtl';

    if (element.hasAttribute('disabled') || element.getAttribute('aria-disabled') === 'true') {
      states.push(isHebrew ? 'לא זמין' : 'disabled');
    }

    if (element.getAttribute('aria-expanded') === 'true') {
      states.push(isHebrew ? 'פתוח' : 'expanded');
    } else if (element.getAttribute('aria-expanded') === 'false') {
      states.push(isHebrew ? 'סגור' : 'collapsed');
    }

    if (element.getAttribute('aria-selected') === 'true') {
      states.push(isHebrew ? 'נבחר' : 'selected');
    }

    if (element.getAttribute('aria-checked') === 'true') {
      states.push(isHebrew ? 'מסומן' : 'checked');
    } else if (element.getAttribute('aria-checked') === 'false') {
      states.push(isHebrew ? 'לא מסומן' : 'unchecked');
    }

    return states.join(', ');
  }

  /**
   * Enhance focus indicator for better visibility
   */
  private enhanceFocusIndicator(element: HTMLElement) {
    if (!this.settings.focusIndicators) return;

    // Remove existing enhanced focus
    document.querySelectorAll('.accessibility-focus-enhanced').forEach(el => {
      el.classList.remove('accessibility-focus-enhanced');
    });

    // Add enhanced focus to current element
    element.classList.add('accessibility-focus-enhanced');
  }

  /**
   * Announce text to screen readers
   */
  announce(text: string, priority: 'polite' | 'assertive' = 'polite') {
    if (!this.announcer || !this.settings.announcements) return;

    this.announcer.setAttribute('aria-live', priority);
    this.announcer.textContent = text;

    // Clear after announcement
    setTimeout(() => {
      if (this.announcer) {
        this.announcer.textContent = '';
      }
    }, 1000);
  }

  /**
   * Speak text using text-to-speech
   */
  speak(text: string, interrupt: boolean = false) {
    if (!this.speechSynthesis || !this.settings.textToSpeech) return;

    if (interrupt && this.currentUtterance) {
      this.speechSynthesis.cancel();
    }

    this.currentUtterance = new SpeechSynthesisUtterance(text);
    this.currentUtterance.lang = document.documentElement.lang || 'he-IL';
    this.currentUtterance.rate = 0.9;
    this.currentUtterance.pitch = 1;
    this.currentUtterance.volume = 0.8;

    this.speechSynthesis.speak(this.currentUtterance);
  }

  /**
   * Stop current speech
   */
  stopSpeaking() {
    if (this.speechSynthesis) {
      this.speechSynthesis.cancel();
    }
  }

  /**
   * Update accessibility setting
   */
  updateSetting<K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) {
    this.settings[key] = value;
    this.saveSettings();
    this.applySettings();
    this.notifyListeners(key, value);
  }

  /**
   * Get current settings
   */
  getSettings(): AccessibilitySettings {
    return { ...this.settings };
  }

  /**
   * Apply all accessibility settings to the DOM
   */
  private applySettings() {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;

    // High contrast mode
    root.classList.toggle('accessibility-high-contrast', this.settings.highContrast);

    // Large text - Apply when largeText is true OR when fontSize is large/extra-large
    const shouldApplyLargeText = this.settings.largeText || 
      this.settings.fontSize === 'large' || 
      this.settings.fontSize === 'extra-large';
    root.classList.toggle('accessibility-large-text', shouldApplyLargeText);

    // Reduce motion
    root.classList.toggle('accessibility-reduce-motion', this.settings.reduceMotion);

    // Focus indicators
    root.classList.toggle('accessibility-enhanced-focus', this.settings.focusIndicators);

    // Color blind support
    root.classList.toggle('accessibility-color-blind', this.settings.colorBlindSupport);

    // Font size
    root.setAttribute('data-accessibility-font-size', this.settings.fontSize);

    // Add CSS custom properties for accessibility
    this.updateCSSCustomProperties();
  }

  /**
   * Update CSS custom properties for accessibility
   */
  private updateCSSCustomProperties() {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;

    // Font size multipliers
    const fontSizeMultipliers = {
      small: 0.875,
      medium: 1,
      large: 1.125,
      'extra-large': 1.25,
    };

    const lineHeightMultipliers = {
      small: 1.2,
      medium: 1.2,
      large: 1.3,
      'extra-large': 1.4,
    };

    root.style.setProperty(
      '--accessibility-font-scale',
      fontSizeMultipliers[this.settings.fontSize].toString()
    );

    root.style.setProperty(
      '--accessibility-line-height-scale',
      lineHeightMultipliers[this.settings.fontSize].toString()
    );

    // High contrast colors
    if (this.settings.highContrast) {
      root.style.setProperty('--accessibility-bg-primary', '#000000');
      root.style.setProperty('--accessibility-text-primary', '#ffffff');
      root.style.setProperty('--accessibility-border-color', '#ffffff');
      root.style.setProperty('--accessibility-focus-color', '#ffff00');
    } else {
      root.style.removeProperty('--accessibility-bg-primary');
      root.style.removeProperty('--accessibility-text-primary');
      root.style.removeProperty('--accessibility-border-color');
      root.style.removeProperty('--accessibility-focus-color');
    }

    // Force a repaint to ensure changes are applied
    if (typeof document !== 'undefined') {
      // Trigger a reflow by reading a computed style
      void document.documentElement.offsetHeight;
    }
  }

  /**
   * Load settings from localStorage
   */
  private loadSettings(): AccessibilitySettings {
    if (typeof localStorage === 'undefined') return defaultAccessibilitySettings;

    try {
      const saved = localStorage.getItem('accessibility-settings');
      if (saved) {
        return { ...defaultAccessibilitySettings, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.warn('Failed to load accessibility settings:', error);
    }

    return defaultAccessibilitySettings;
  }

  /**
   * Save settings to localStorage
   */
  private saveSettings() {
    if (typeof localStorage === 'undefined') return;

    try {
      localStorage.setItem('accessibility-settings', JSON.stringify(this.settings));
    } catch (error) {
      console.warn('Failed to save accessibility settings:', error);
    }
  }

  /**
   * Add event listener for setting changes
   */
  addEventListener(event: string, callback: (key: string, value: unknown) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  /**
   * Remove event listener
   */
  removeEventListener(event: string, callback: (key: string, value: unknown) => void) {
    const listeners = this.listeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Notify listeners of setting changes
   */
  private notifyListeners(key: string, value: unknown) {
    const listeners = this.listeners.get(key) || this.listeners.get('change');
    if (listeners) {
      listeners.forEach(callback => callback(key, value));
    }
  }

  /**
   * Focus management utilities
   */
  focusUtils = {
    /**
     * Move focus to first focusable element in container
     */
    focusFirst: (container: HTMLElement) => {
      const focusable = container.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement;
      focusable?.focus();
    },

    /**
     * Move focus to last focusable element in container
     */
    focusLast: (container: HTMLElement) => {
      const focusableElements = container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
      lastElement?.focus();
    },

    /**
     * Trap focus within container
     */
    trapFocus: (container: HTMLElement) => {
      const focusableElements = container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as NodeListOf<HTMLElement>;
      
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      const handleTabKey = (e: KeyboardEvent) => {
        if (e.key !== 'Tab') return;

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      };

      container.addEventListener('keydown', handleTabKey);
      
      // Return cleanup function
      return () => {
        container.removeEventListener('keydown', handleTabKey);
      };
    }
  };
}

// Create singleton instance
export const accessibilityService = new AccessibilityService();

// Export utility functions
export const {
  announce,
  speak,
  stopSpeaking,
  updateSetting,
  getSettings,
  announceElement,
  focusUtils,
} = accessibilityService;
