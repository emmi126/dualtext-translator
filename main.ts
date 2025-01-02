// Import required modules from the Obsidian API
import { App, Plugin, PluginSettingTab, Setting, Modal } from 'obsidian';

// Define plugin settings interface
interface DualTextTranslatorSettings {
    sourceLanguage: string;
    targetLanguage: string;
    apiKey: string;
}

// Default settings
const DEFAULT_SETTINGS: DualTextTranslatorSettings = {
    sourceLanguage: 'en',
    targetLanguage: 'fr',
    apiKey: 'auth-placeholder-deepl-zx9y8w7v6u5t4s3r2q1p0n'
};

// Main plugin class
export default class DualTextTranslatorPlugin extends Plugin {
    settings: DualTextTranslatorSettings;

    async onload() {
        console.log("Loading DualText Translator Plugin");

        // Load settings
        await this.loadSettings();

        // Add command for translation
        this.addCommand({
            id: 'translate-selection',
            name: 'Translate Selected Text',
            editorCallback: (editor) => this.translateSelection(editor),
        });

        // Add settings tab
        this.addSettingTab(new DualTextTranslatorSettingTab(this.app, this));
    }

    async translateSelection(editor: Editor) {
        const selectedText = editor.getSelection();
        if (!selectedText) {
            new Notice('No text selected!');
            return;
        }

        // Call translation API
        const translatedText = await this.translateText(selectedText);
        if (translatedText) {
            new TranslationModal(this.app, selectedText, translatedText).open();
        }
    }

    async translateText(text: string): Promise<string | null> {
        const { sourceLanguage, targetLanguage, apiKey } = this.settings;

        if (!apiKey || apiKey === 'auth-placeholder-deepl-zx9y8w7v6u5t4s3r2q1p0n') {
            new Notice('API key not configured or is a placeholder!');
            return null;
        }

        const url = `https://api.deepl.com/v2/translate?auth_key=${apiKey}&text=${encodeURIComponent(text)}&source_lang=${sourceLanguage}&target_lang=${targetLanguage}`; // Replace with real endpoint

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`API Error: ${response.statusText}`);
            }
            const data = await response.json();
            return data.translations?.[0]?.text || 'Translation failed';
        } catch (error) {
            console.error(error);
            new Notice('Failed to fetch translation.');
            return null;
        }
    }

    onunload() {
        console.log("Unloading DualText Translator Plugin");
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}

// Modal to display original and translated text
class TranslationModal extends Modal {
    originalText: string;
    translatedText: string;

    constructor(app: App, originalText: string, translatedText: string) {
        super(app);
        this.originalText = originalText;
        this.translatedText = translatedText;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();

        contentEl.createEl('h2', { text: 'Translation' });

        contentEl.createEl('h3', { text: 'Original' });
        contentEl.createEl('p', { text: this.originalText });

        contentEl.createEl('h3', { text: 'Translated' });
        contentEl.createEl('p', { text: this.translatedText });

        const closeButton = contentEl.createEl('button', { text: 'Close' });
        closeButton.addEventListener('click', () => this.close());
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

// Settings tab for the plugin
class DualTextTranslatorSettingTab extends PluginSettingTab {
    plugin: DualTextTranslatorPlugin;

    constructor(app: App, plugin: DualTextTranslatorPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        containerEl.createEl('h2', { text: 'DualText Translator Plugin Settings' });

        new Setting(containerEl)
            .setName('Source Language')
            .setDesc('The language of the original text.')
            .addText((text) =>
                text
                    .setPlaceholder('e.g., en')
                    .setValue(this.plugin.settings.sourceLanguage)
                    .onChange(async (value) => {
                        this.plugin.settings.sourceLanguage = value;
                        await this.plugin.saveSettings();
                    })
            );

        new Setting(containerEl)
            .setName('Target Language')
            .setDesc('The language for translation.')
            .addText((text) =>
                text
                    .setPlaceholder('e.g., fr')
                    .setValue(this.plugin.settings.targetLanguage)
                    .onChange(async (value) => {
                        this.plugin.settings.targetLanguage = value;
                        await this.plugin.saveSettings();
                    })
            );

        new Setting(containerEl)
            .setName('API Key')
            .setDesc('API key for the translation service.')
            .addText((text) =>
                text
                    .setPlaceholder('Enter your API key')
                    .setValue(this.plugin.settings.apiKey)
                    .onChange(async (value) => {
                        this.plugin.settings.apiKey = value;
                        await this.plugin.saveSettings();
                    })
            );
    }
}
