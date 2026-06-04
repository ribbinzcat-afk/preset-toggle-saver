import { extension_settings, getContext, loadExtensionSettings } from "../../../extensions.js";
import { saveSettingsDebounced } from "../../../../script.js";

const extensionName = "preset-toggle-saver";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;

// NEW: กำหนดค่าเริ่มต้น
const defaultSettings = {
    testToggle: false
};

// NEW: ฟังก์ชันสำหรับโหลดการตั้งค่า
async function loadSettings() {
    extension_settings[extensionName] = extension_settings[extensionName] || {};

    if (Object.keys(extension_settings[extensionName]).length === 0) {
        Object.assign(extension_settings[extensionName], defaultSettings);
    }

    $("#test_checkbox").prop("checked", extension_settings[extensionName].testToggle);
}

// NEW: ฟังก์ชันเมื่อมีการติ๊ก Checkbox
function onCheckboxChange(event) {
    const value = Boolean($(event.target).prop("checked"));
    extension_settings[extensionName].testToggle = value;
    saveSettingsDebounced();
    console.log(`[${extensionName}] Setting saved:`, value);
}

jQuery(async () => {
    console.log(`[${extensionName}] Loading...`);

    try {
        const settingsHtml = await $.get(`${extensionFolderPath}/example.html`);
        $("#extensions_settings2").append(settingsHtml);

        // NEW: ผูก Event ให้ Checkbox ทำงานเมื่อมีการคลิก
        $("#test_checkbox").on("input", onCheckboxChange);

        // NEW: โหลดค่าที่เคยบันทึกไว้
        loadSettings();

        console.log(`[${extensionName}] ✅ Loaded successfully`);
    } catch (error) {
        console.error(`[${extensionName}] ❌ Failed to load:`, error);
    }
});
