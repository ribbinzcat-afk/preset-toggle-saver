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

// CHANGED: เปลี่ยนวิธีจำไปใช้ data-pm-identifier (บัตรประชาชนของ Prompt)
function onSaveButtonClicked() {
    const currentPreset = getCurrentPresetName();
    if (currentPreset === "ไม่ทราบชื่อ Preset") {
        toastr.warning("ไม่สามารถเซฟได้เพราะไม่ทราบชื่อ Preset ค่ะ", "Preset Toggle Saver");
        return;
    }

    const toggleStates = {};
    let count = 0;

    $('#completion_prompt_manager .prompt-manager-toggle-action').each(function() {
        const isOn = $(this).hasClass('fa-toggle-on');

        // ย้อนกลับไปหา <li> ที่ครอบตัวมันอยู่ เพื่อดึง data-pm-identifier
        const identifier = $(this).closest('li').attr('data-pm-identifier');

        // ถ้ามี identifier ค่อยบันทึกค่ะ
        if (identifier) {
            toggleStates[identifier] = isOn;
            count++;
        }
    });

    extension_settings[extensionName].presets[currentPreset] = toggleStates;
    saveSettingsDebounced();

    toastr.success(`บันทึกสถานะ ${count} Toggles สำหรับ Preset: ${currentPreset} เรียบร้อยแล้วค่ะ!`, "Preset Toggle Saver");
    console.log(`[${extensionName}] บันทึก Preset [${currentPreset}]:`, toggleStates);
}

// CHANGED: เปลี่ยนวิธีโหลดให้จับคู่กับ data-pm-identifier
function applySavedToggles(presetName) {
    const savedStates = extension_settings[extensionName].presets[presetName];

    if (!savedStates) {
        console.log(`[${extensionName}] ไม่มีข้อมูล Toggles ที่บันทึกไว้สำหรับ: ${presetName}`);
        return;
    }

    console.log(`[${extensionName}] กำลังโหลด Toggles สำหรับ: ${presetName}`);
    let changedCount = 0;

    $('#completion_prompt_manager .prompt-manager-toggle-action').each(function() {
        const identifier = $(this).closest('li').attr('data-pm-identifier');

        // ถ้าไม่มี identifier หรือเราไม่เคยเซฟค่าของตัวนี้ไว้ ก็ข้ามไปค่ะ
        if (!identifier || savedStates[identifier] === undefined) return;

        const shouldBeOn = savedStates[identifier];
        const isCurrentlyOn = $(this).hasClass('fa-toggle-on');

        if (shouldBeOn !== isCurrentlyOn) {
            $(this).trigger('click');
            changedCount++;
        }
    });

    if (changedCount > 0) {
        toastr.info(`ปรับสถานะ Toggles อัตโนมัติ (${changedCount} รายการ) สำหรับ: ${presetName}`, "Preset Toggle Saver");
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
        // ให้เวลา SillyTavern วางเรียง Prompt ให้เสร็จก่อนนิดนึงค่ะ
        setTimeout(() => {
            applySavedToggles(newPresetName);
        }, 1000);
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

        $(document).on("change", 'select[id^="settings_preset_"]', onPresetChanged);
        $(document).on("click", '.api-connection-settings', () => {
             setTimeout(onPresetChanged, 1000);
        });

        console.log(`[${extensionName}] ✅ Loaded successfully`);
    } catch (error) {
        console.error(`[${extensionName}] ❌ Failed to load:`, error);
    }
});
