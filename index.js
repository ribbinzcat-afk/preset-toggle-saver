import { extension_settings, getContext, loadExtensionSettings } from "../../../extensions.js";
import { saveSettingsDebounced } from "../../../../script.js";

const extensionName = "preset-toggle-saver";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;

// NEW: เตรียมพื้นที่สำหรับเก็บข้อมูล Preset ของเรา
const defaultSettings = {
    presets: {} // จะเก็บข้อมูลแบบนี้ค่ะ: { "ชื่อพรีเซ็ต": [true, false, true, ...] }
};

function getCurrentPresetName() {
    const visibleSelect = $('select[id^="settings_preset_"]:visible');
    if (visibleSelect.length > 0) {
        const presetName = visibleSelect.find(":selected").text();
        return presetName || "ไม่ทราบชื่อ Preset";
    }
    return "ไม่ทราบชื่อ Preset";
}

// NEW: ฟังก์ชันสำหรับโหลดการตั้งค่า
function loadSettings() {
    extension_settings[extensionName] = extension_settings[extensionName] || {};
    if (Object.keys(extension_settings[extensionName]).length === 0) {
        Object.assign(extension_settings[extensionName], defaultSettings);
    }
    if (!extension_settings[extensionName].presets) {
        extension_settings[extensionName].presets = {};
    }
}

// NEW: ฟังก์ชันทำงานเมื่อกดปุ่ม "เซฟ"
function onSaveButtonClicked() {
    const currentPreset = getCurrentPresetName();
    if (currentPreset === "ไม่ทราบชื่อ Preset") {
        toastr.warning("ไม่สามารถเซฟได้เพราะไม่ทราบชื่อ Preset ค่ะ", "Preset Toggle Saver");
        return;
    }

    // กวาดหา Toggle ทั้งหมดที่มีคลาส prompt-manager-toggle-action
    const toggleStates = [];
    $('.prompt-manager-toggle-action').each(function() {
        // ถ้ามีคลาส fa-toggle-on ถือว่าเปิดอยู่ (true)
        const isOn = $(this).hasClass('fa-toggle-on');
        toggleStates.push(isOn);
    });

    // บันทึกลงใน Settings
    extension_settings[extensionName].presets[currentPreset] = toggleStates;
    saveSettingsDebounced();

    toastr.success(`บันทึกสถานะ ${toggleStates.length} Toggles สำหรับ Preset: ${currentPreset} เรียบร้อยแล้วค่ะ!`, "Preset Toggle Saver");
    console.log(`[${extensionName}] บันทึก Preset [${currentPreset}]:`, toggleStates);
}

function updatePresetUi() {
    const currentPreset = getCurrentPresetName();

    $("#preset-toggle-status").html(`
        <p>กำลังตั้งค่า Toggle สำหรับ Preset: <b>${currentPreset}</b></p>
        <div style="margin-top: 10px; display: flex; gap: 5px;">
            <input id="pts-btn-save" class="menu_button" type="button" value="เซฟ Toggles" />
            <input id="pts-btn-delete" class="menu_button" type="button" value="ลบข้อมูล Preset นี้" />
        </div>
    `);

    // ผูก Event ให้ปุ่มเซฟ
    $("#pts-btn-save").off("click").on("click", onSaveButtonClicked);

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

        loadSettings();
        updatePresetUi();

        // CHANGED: สั่งให้อัปเดต UI ซ้ำอีกครั้งหลังจากเวลาผ่านไปนิดหน่อย เพื่อแก้ปัญหาชื่อไม่ขึ้นตอนโหลดครั้งแรก
        setTimeout(updatePresetUi, 1000);
        setTimeout(updatePresetUi, 2500);

        $(document).on("change", 'select[id^="settings_preset_"]', updatePresetUi);
        $(document).on("click", '.api-connection-settings', () => {
             setTimeout(updatePresetUi, 100);
        });

        console.log(`[${extensionName}] ✅ Loaded successfully`);
    } catch (error) {
        console.error(`[${extensionName}] ❌ Failed to load:`, error);
    }
});
