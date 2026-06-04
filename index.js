import { extension_settings, getContext, loadExtensionSettings } from "../../../extensions.js";
import { saveSettingsDebounced } from "../../../../script.js";

const extensionName = "preset-toggle-saver";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;

// NEW: ฟังก์ชันสำหรับดึงชื่อ Preset ปัจจุบัน
function getCurrentPresetName() {
    // ใน SillyTavern ตัวเลือก Preset ของ Text Generation มักจะมี ID เป็น settings_presets
    const presetName = $("#settings_presets").find(":selected").val() || "ไม่ทราบชื่อ Preset";
    return presetName;
}

// NEW: ฟังก์ชันสำหรับอัปเดตหน้าตา UI ของเรา
function updatePresetUi() {
    const currentPreset = getCurrentPresetName();

    // อัปเดตข้อความและสร้างปุ่ม
    $("#preset-toggle-status").html(`
        <p>กำลังตั้งค่า Toggle สำหรับ Preset: <b>${currentPreset}</b></p>
        <div style="margin-top: 10px; display: flex; gap: 5px;">
            <input id="pts-btn-add" class="menu_button" type="button" value="เพิ่ม Toggle" />
            <input id="pts-btn-save" class="menu_button" type="button" value="เซฟ" />
            <input id="pts-btn-delete" class="menu_button" type="button" value="ลบทั้งหมด" />
        </div>
    `);

    // ผูก Event ให้ปุ่ม (ตอนนี้แค่ให้แสดงข้อความใน Console เพื่อทดสอบก่อนค่ะ)
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

        // NEW: อัปเดต UI ครั้งแรกตอนที่โหลดเสร็จ
        updatePresetUi();

        // NEW: ดักจับเวลาที่คุณผู้ใช้เปลี่ยน Preset ให้ UI ของเราอัปเดตตาม
        $("#settings_presets").on("change", updatePresetUi);

        console.log(`[${extensionName}] ✅ Loaded successfully`);
    } catch (error) {
        console.error(`[${extensionName}] ❌ Failed to load:`, error);
    }
});
