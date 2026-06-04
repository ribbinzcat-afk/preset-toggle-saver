import { extension_settings, getContext, loadExtensionSettings } from "../../../extensions.js";
import { saveSettingsDebounced } from "../../../../script.js";

const extensionName = "preset-toggle-saver";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;

const defaultSettings = {
    presets: {} // รูปแบบข้อมูลจะเปลี่ยนไปเป็น { "Preset Name": { "toggle_id_1": true, "toggle_id_2": false } }
};

function getCurrentPresetName() {
    const visibleSelect = $('select[id^="settings_preset_"]:visible');
    if (visibleSelect.length > 0) {
        const presetName = visibleSelect.find(":selected").text();
        return presetName || "ไม่ทราบชื่อ Preset";
    }
    return "ไม่ทราบชื่อ Preset";
}

function loadSettings() {
    extension_settings[extensionName] = extension_settings[extensionName] || {};
    if (Object.keys(extension_settings[extensionName]).length === 0) {
        Object.assign(extension_settings[extensionName], defaultSettings);
    }
    if (!extension_settings[extensionName].presets) {
        extension_settings[extensionName].presets = {};
    }
}

// CHANGED: เปลี่ยนวิธีเซฟ ให้จดจำ Identifier (ID ของ div ที่ครอบมันอยู่ หรือ ID ของตัวมันเอง)
function onSaveButtonClicked() {
    const currentPreset = getCurrentPresetName();
    if (currentPreset === "ไม่ทราบชื่อ Preset") {
        toastr.warning("ไม่สามารถเซฟได้เพราะไม่ทราบชื่อ Preset ค่ะ", "Preset Toggle Saver");
        return;
    }

    const toggleStates = {};
    let count = 0;

    $('.prompt-manager-toggle-action').each(function() {
        const isOn = $(this).hasClass('fa-toggle-on');

        // หา ID ที่ไม่ซ้ำกันของ Toggle ตัวนี้ โดยหาจาก parent หรือตัวมันเอง
        // ใน SillyTavern Toggle มักจะอยู่ใน div ที่มี id เริ่มด้วย "prompt-manager-"
        const parentId = $(this).closest('[id]').attr('id') || `unknown_toggle_${count}`;

        toggleStates[parentId] = isOn;
        count++;
    });

    extension_settings[extensionName].presets[currentPreset] = toggleStates;
    saveSettingsDebounced();

    toastr.success(`บันทึกสถานะ ${count} Toggles สำหรับ Preset: ${currentPreset} เรียบร้อยแล้วค่ะ!`, "Preset Toggle Saver");
    console.log(`[${extensionName}] บันทึก Preset [${currentPreset}]:`, toggleStates);
}

// CHANGED: เปลี่ยนวิธีโหลด ให้จับคู่กับ Identifier ที่เซฟไว้
function applySavedToggles(presetName) {
    const savedStates = extension_settings[extensionName].presets[presetName];

    if (!savedStates) {
        console.log(`[${extensionName}] ไม่มีข้อมูล Toggles ที่บันทึกไว้สำหรับ: ${presetName}`);
        return;
    }

    console.log(`[${extensionName}] กำลังโหลด Toggles สำหรับ: ${presetName}`);

    let changedCount = 0;

    $('.prompt-manager-toggle-action').each(function() {
        // หา ID แบบเดียวกับตอนที่เซฟ
        const parentId = $(this).closest('[id]').attr('id');

        // ถ้าหา ID ไม่เจอ หรือไม่มีข้อมูลที่เซฟไว้สำหรับ ID นี้ ให้ข้ามไปค่ะ
        if (!parentId || savedStates[parentId] === undefined) return;

        const shouldBeOn = savedStates[parentId];
        const isCurrentlyOn = $(this).hasClass('fa-toggle-on');

        if (shouldBeOn !== isCurrentlyOn) {
            $(this).trigger('click');
            changedCount++;
        }
    });

    if (changedCount > 0) {
        toastr.info(`ปรับสถานะ Toggles อัตโนมัติ (${changedCount} รายการ)`, "Preset Toggle Saver");
    }
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

    $("#pts-btn-save").off("click").on("click", onSaveButtonClicked);
    $("#pts-btn-delete").off("click").on("click", () => console.log(`[${extensionName}] ปุ่ม 'ลบ' ถูกคลิก (Preset: ${currentPreset})`));
}

function onPresetChanged() {
    updatePresetUi();
    const newPresetName = getCurrentPresetName();
    if (newPresetName !== "ไม่ทราบชื่อ Preset") {
        applySavedToggles(newPresetName);
    }
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

        setTimeout(updatePresetUi, 1000);
        setTimeout(updatePresetUi, 3000);
        setTimeout(updatePresetUi, 6000);

        $(document).on("change", 'select[id^="settings_preset_"]', onPresetChanged);
        $(document).on("click", '.api-connection-settings', () => {
             setTimeout(onPresetChanged, 100);
        });

        console.log(`[${extensionName}] ✅ Loaded successfully`);
    } catch (error) {
        console.error(`[${extensionName}] ❌ Failed to load:`, error);
    }
});
