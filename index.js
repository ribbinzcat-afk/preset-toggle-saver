import { extension_settings, getContext, loadExtensionSettings } from "../../../extensions.js";
import { saveSettingsDebounced } from "../../../../script.js";

const extensionName = "preset-toggle-saver";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;

jQuery(async () => {
    console.log(`[${extensionName}] Loading...`);

    try {
        const settingsHtml = await $.get(`${extensionFolderPath}/example.html`);

        // 1. ใส่ Drawer เดิมไว้ที่หน้า Extensions
        $("#extensions_settings2").append(settingsHtml);

        // NEW: 2. สร้าง UI ของเราเป็นตัวแปร String โดยตรง เพื่อป้องกันปัญหาดึง Template ไม่ติด
        const mainUiHtml = `
            <div id="preset-toggle-saver-main-ui" style="margin-top: 10px; margin-bottom: 10px; padding: 10px; border: 1px solid var(--SmartThemeBorderColor); border-radius: 5px;">
                <h4 style="margin-top: 0; margin-bottom: 10px;">🌸 Preset Toggle Saver</h4>
                <div id="preset-toggle-status">
                    <p><i>กำลังรอการเชื่อมต่อกับ Preset ปัจจุบัน...</i></p>
                </div>
            </div>
        `;

        // NEW: 3. แทรก UI ของเราไว้ "ด้านบน" (insertBefore) ของ completion_prompt_manager
        $(mainUiHtml).insertBefore("#completion_prompt_manager");

        console.log(`[${extensionName}] ✅ Loaded successfully`);
    } catch (error) {
        console.error(`[${extensionName}] ❌ Failed to load:`, error);
    }
});
