import { extension_settings, getContext, loadExtensionSettings } from "../../../extensions.js";
import { saveSettingsDebounced } from "../../../../script.js";

const extensionName = "preset-toggle-saver";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;

// CHANGED: แก้ไขฟังก์ชันดึงชื่อ Preset ให้รองรับหลาย API และดึง Text ออกมา
function getCurrentPresetName() {
    // หา <select> ที่ id เริ่มด้วย "settings_preset_" และกำลังแสดงผลอยู่บนหน้าจอ
    const visibleSelect = $('select[id^="settings_preset_"]:visible');

    if (visibleSelect.length > 0) {
        // ใช้ .text() เพื่อดึง "ชื่อพรีเซ็ต" ที่แสดงให้คนอ่าน ไม่ใช่ .val() ที่อาจเป็นแค่ตัวเลข
        const presetName = visibleSelect.find(":selected").text();
        return presetName || "ไม่ทราบชื่อ Preset";
    }

    return "ไม่ทราบชื่อ Preset";
}

function updatePresetUi() {
    const currentPreset = getCurrentPresetName();

    $("#preset-toggle-status").html(`
        <p>กำลังตั้งค่า Toggle สำหรับ Preset: <b>${currentPreset}</b></p>
        <div style="margin-top: 10px; display: flex; gap: 5px;">
            <input id="pts-btn-add" class="menu_button" type="button" value="เพิ่ม Toggle" />
            <input id="pts-btn-save" class="menu_button" type="button" value="เซฟ" />
            <input id="pts-btn-delete" class="menu_button" type="button" value="ลบทั้งหมด" />
        </div>
    `);

    $("#pts-btn-add").off("click").on("click", () => console.log(`[${extensionName}] ปุ่ม 'เพิ่ม' ถูกคลิก (Preset: ${currentPreset})`));
    $("#pts-btn-save").off("click").on("click", () => console.log(`[${extensionName}] ปุ่ม 'เซฟ' ถูกคลิก (Preset: ${currentPreset})`));
    $("#pts-btn-delete").off("click").on("click", () => console.log(`[${extensionName}] ปุ่ม 'ลบ' ถูกคลิก (Preset: ${currentPreset})`));
}

jQuery(async () => {
    console.log(`[${extensionName}] Loading...`);

    try {
        const settingsHtml = await $.get(`${extensionFolderPath}/example.html`);
        $("#extensions_settings2").append(settingsHtml);

        const mainUiHtml = `
            <div id="preset-toggle-saver-main-ui" style="margin-top: 10px; margin-bottom: 10px; padding: 10px; border: 1px solid var(--SmartThemeBorderColor); border-radius: 5px;">
                <h4 style="margin-top: 0; margin-bottom: 10px;">🌸 Preset Toggle Saver</h4>
                <div id="preset-toggle-status">
                    <p><i>กำลังรอการเชื่อมต่อกับ Preset ปัจจุบัน...</i></p>
                </div>
            </div>
        `;

        $(mainUiHtml).insertBefore("#completion_prompt_manager");

        updatePresetUi();

        // CHANGED: ดักจับการเปลี่ยนแปลงของ <select> ทุกตัวที่เป็น Preset Manager
        $(document).on("change", 'select[id^="settings_preset_"]', updatePresetUi);

        // NEW: บางครั้งตอนเปลี่ยน API หน้าจอจะเปลี่ยนไปดึง Dropdown ตัวอื่นมาแสดง เราต้องอัปเดต UI ด้วย
        $(document).on("click", '.api-connection-settings', () => {
             setTimeout(updatePresetUi, 100); // หน่วงเวลานิดนึงรอให้ UI ของ SillyTavern โหลดเสร็จ
        });

        console.log(`[${extensionName}] ✅ Loaded successfully`);
    } catch (error) {
        console.error(`[${extensionName}] ❌ Failed to load:`, error);
    }
});
