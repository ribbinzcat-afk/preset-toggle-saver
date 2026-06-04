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

        // NEW: 2. นำ Template ที่เราสร้างไว้ ไปแปะในหน้า AI Response Configuration
        // โดยปกติหน้าตั้งค่า Sliders ต่างๆ จะอยู่ใน #textgeneration_settings
        const mainUiHtml = $("#preset-toggle-ui-template").html();

        // ลองแทรกไว้ด้านล่างสุดของหน้าต่าง Text Generation
        $("#textgeneration_settings").append(mainUiHtml);

        console.log(`[${extensionName}] ✅ Loaded successfully`);
    } catch (error) {
        console.error(`[${extensionName}] ❌ Failed to load:`, error);
    }
});
