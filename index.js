import { extension_settings, getContext, loadExtensionSettings } from "../../../extensions.js";
import { saveSettingsDebounced } from "../../../../script.js";

const extensionName = "preset-toggle-saver";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;

const defaultSettings = {
    presets: {}
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

function onSaveButtonClicked() {
    const currentPreset = getCurrentPresetName();
    if (currentPreset === "ไม่ทราบชื่อ Preset") {
        toastr.warning("ไม่สามารถเซฟได้เพราะไม่ทราบชื่อ Preset ค่ะ", "Preset Toggle Saver");
        return;
    }

    const toggleStates = [];
    $('.prompt-manager-toggle-action').each(function() {
        const isOn = $(this).hasClass('fa-toggle-on');
        toggleStates.push(isOn);
    });

    extension_settings[extensionName].presets[currentPreset] = toggleStates;
    saveSettingsDebounced();

    toastr.success(`บันทึกสถานะ Toggles สำหรับ Preset: ${currentPreset} เรียบร้อยแล้วค่ะ!`, "Preset Toggle Saver");
    console.log(`[${extensionName}] บันทึก Preset [${currentPreset}]:`, toggleStates);
}

// NEW: ฟังก์ชันสำหรับโหลดและปรับสถานะ Toggle ให้ตรงกับที่เซฟไว้
function applySavedToggles(presetName) {
    const savedStates = extension_settings[extensionName].presets[presetName];

    // ถ้ายังไม่เคยเซฟข้อมูลของ Preset นี้ไว้ ก็ไม่ต้องทำอะไรค่ะ
    if (!savedStates) {
        console.log(`[${extensionName}] ไม่มีข้อมูล Toggles ที่บันทึกไว้สำหรับ: ${presetName}`);
        return;
    }

    console.log(`[${extensionName}] กำลังโหลด Toggles สำหรับ: ${presetName}`, savedStates);

    let changedCount = 0;

    // กวาดหา Toggle ทั้งหมดที่มีอยู่บนหน้าจอ
    $('.prompt-manager-toggle-action').each(function(index) {
        // ถ้า index เกินกว่าข้อมูลที่เราเคยเซฟไว้ ก็ข้ามไปค่ะ (เผื่อมีการเพิ่ม/ลดจำนวน Toggle ในอนาคต)
        if (index >= savedStates.length) return;

        const shouldBeOn = savedStates[index];
        const isCurrentlyOn = $(this).hasClass('fa-toggle-on');

        // ถ้าสถานะปัจจุบัน ไม่ตรงกับที่เราเซฟไว้ ให้ทำการจำลองการคลิกเพื่อสลับสถานะค่ะ
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

// NEW: ฟังก์ชันที่จะทำงานเมื่อมีการเปลี่ยน Preset ใน Dropdown
function onPresetChanged() {
    // อัปเดต UI เพื่อให้ชื่อเปลี่ยน
    updatePresetUi();

    // ดึงชื่อ Preset ใหม่ที่เพิ่งเปลี่ยนมา
    const newPresetName = getCurrentPresetName();

    // โหลด Toggle ที่เซฟไว้ (ถ้ามี)
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

        // CHANGED: เพิ่มเวลา Delay ให้ครอบคลุมมากขึ้น รอจนกว่า SillyTavern จะพร้อมจริงๆ ค่ะ
        setTimeout(updatePresetUi, 1000);
        setTimeout(updatePresetUi, 3000);
        setTimeout(updatePresetUi, 6000); // เผื่อคอมพิวเตอร์กำลังประมวลผลหนักค่ะ

        // CHANGED: เปลี่ยนให้ไปเรียกฟังก์ชัน onPresetChanged แทน เพื่อให้โหลด Toggle ด้วย
        $(document).on("change", 'select[id^="settings_preset_"]', onPresetChanged);

        $(document).on("click", '.api-connection-settings', () => {
             setTimeout(onPresetChanged, 100);
        });

        console.log(`[${extensionName}] ✅ Loaded successfully`);
    } catch (error) {
        console.error(`[${extensionName}] ❌ Failed to load:`, error);
    }
});
