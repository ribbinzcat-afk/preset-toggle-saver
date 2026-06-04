import { extension_settings, getContext, loadExtensionSettings } from "../../../extensions.js";
import { saveSettingsDebounced } from "../../../../script.js";

const extensionName = "preset-toggle-saver";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;

const defaultSettings = {
    myPresets: {},       // เก็บข้อมูล Toggle ในแต่ละ Preset
    currentPreset: ""    // จำว่าตอนนี้เรากำลังเลือก Preset อะไรอยู่
};

function loadSettings() {
    extension_settings[extensionName] = extension_settings[extensionName] || {};
    if (Object.keys(extension_settings[extensionName]).length === 0) {
        Object.assign(extension_settings[extensionName], defaultSettings);
    }
    if (!extension_settings[extensionName].myPresets) extension_settings[extensionName].myPresets = {};
    if (extension_settings[extensionName].currentPreset === undefined) extension_settings[extensionName].currentPreset = "";
}

// อัปเดตรายชื่อใน Dropdown
function updateDropdown() {
    const presetNames = Object.keys(extension_settings[extensionName].myPresets);
    const $select = $("#pts-preset-select");
    $select.empty();

    if (presetNames.length === 0) {
        $select.append(`<option value="">(ยังไม่มี Preset)</option>`);
    } else {
        presetNames.forEach(name => {
            $select.append(`<option value="${name}">${name}</option>`);
        });
        // เลือกตัวที่เคยเลือกไว้
        if (extension_settings[extensionName].currentPreset && presetNames.includes(extension_settings[extensionName].currentPreset)) {
            $select.val(extension_settings[extensionName].currentPreset);
        }
    }
}

// สร้าง Preset ใหม่
function onNewClicked() {
    const newName = prompt("ตั้งชื่อ Preset ใหม่สำหรับ Toggle ของคุณค่ะ:");
    if (!newName) return;

    if (extension_settings[extensionName].myPresets[newName]) {
        toastr.warning("ชื่อนี้มีอยู่แล้วค่ะ ลองใช้ชื่ออื่นนะคะ", "Toggle Presets");
        return;
    }

    // สร้างพื้นที่ว่างๆ ไว้ก่อน
    extension_settings[extensionName].myPresets[newName] = {};
    extension_settings[extensionName].currentPreset = newName;
    saveSettingsDebounced();

    updateDropdown();
    onSaveClicked(); // กดเซฟสถานะปัจจุบันให้ทันที
}

// เซฟสถานะ Toggle ลง Preset ปัจจุบัน
function onSaveClicked() {
    const currentName = $("#pts-preset-select").val();
    if (!currentName) {
        toastr.warning("กรุณาสร้างหรือเลือก Preset ก่อนเซฟนะคะ", "Toggle Presets");
        return;
    }

    const toggleStates = {};
    let count = 0;

    $('#completion_prompt_manager .prompt-manager-toggle-action').each(function() {
        const isOn = $(this).hasClass('fa-toggle-on');

        // จำจาก "ชื่อ" ของหัวข้อ (เช่น ♡ Milky Core ♡) แทนรหัสยาวๆ ค่ะ
        const promptName = $(this).closest('li').find('.completion_prompt_manager_prompt_name').attr('data-pm-name');

        if (promptName) {
            toggleStates[promptName] = isOn;
            count++;
        }
    });

    extension_settings[extensionName].myPresets[currentName] = toggleStates;
    saveSettingsDebounced();
    toastr.success(`บันทึกสถานะ ${count} Toggles ลงใน '${currentName}' แล้วค่ะ`, "Toggle Presets");
}

// โหลดและปรับ Toggle ตามที่เซฟไว้
function onApplyClicked() {
    const currentName = $("#pts-preset-select").val();
    if (!currentName) return;

    const savedStates = extension_settings[extensionName].myPresets[currentName];
    if (!savedStates) return;

    let changedCount = 0;

    $('#completion_prompt_manager .prompt-manager-toggle-action').each(function() {
        const promptName = $(this).closest('li').find('.completion_prompt_manager_prompt_name').attr('data-pm-name');

        if (!promptName || savedStates[promptName] === undefined) return;

        const shouldBeOn = savedStates[promptName];
        const isCurrentlyOn = $(this).hasClass('fa-toggle-on');

        if (shouldBeOn !== isCurrentlyOn) {
            $(this).trigger('click');
            changedCount++;
        }
    });

    extension_settings[extensionName].currentPreset = currentName;
    saveSettingsDebounced();
    toastr.info(`ปรับสถานะ Toggles (${changedCount} รายการ)`, "Toggle Presets");
}

// ลบ Preset
function onDeleteClicked() {
    const currentName = $("#pts-preset-select").val();
    if (!currentName) return;

    if (confirm(`คุณแน่ใจนะคะว่าจะลบ Preset '${currentName}' ? ความทรงจำนี้จะไม่สามารถเรียกคืนได้แล้วนะคะ...`)) {
        delete extension_settings[extensionName].myPresets[currentName];
        extension_settings[extensionName].currentPreset = "";
        saveSettingsDebounced();
        updateDropdown();
        toastr.success(`ลบ '${currentName}' เรียบร้อยแล้วค่ะ`, "Toggle Presets");
    }
}

jQuery(async () => {
    console.log(`[${extensionName}] Loading...`);

    try {
        const settingsHtml = await $.get(`${extensionFolderPath}/example.html`);
        $("#extensions_settings2").append(settingsHtml);

        // สร้าง UI ของเราเองแยกต่างหาก
        const mainUiHtml = `
            <div id="pts-standalone-ui" style="margin: 15px 0; padding: 15px; background: var(--SmartThemeBlurTintColor); border: 1px solid var(--SmartThemeBorderColor); border-radius: 8px;">
                <h4 style="margin: 0 0 10px 0;"><span class="fa-solid fa-toggle-on"></span> Toggle Presets Manager</h4>
                <div style="display: flex; gap: 5px; align-items: center; margin-bottom: 10px;">
                    <select id="pts-preset-select" class="text_pole" style="flex-grow: 1;"></select>
                    <div id="pts-btn-new" class="menu_button fa-solid fa-plus" title="สร้างใหม่"></div>
                </div>
                <div style="display: flex; gap: 5px;">
                    <input id="pts-btn-apply" class="menu_button" type="button" value="โหลดมาใช้" style="flex: 1;" />
                    <input id="pts-btn-save" class="menu_button" type="button" value="เซฟทับ" style="flex: 1;" />
                    <div id="pts-btn-delete" class="menu_button fa-solid fa-trash redWarningBG" title="ลบ" style="padding: 10px;"></div>
                </div>
            </div>
        `;

        $(mainUiHtml).insertBefore("#completion_prompt_manager");

        loadSettings();
        updateDropdown();

        // ผูก Event ให้ปุ่มต่างๆ
        $("#pts-btn-new").on("click", onNewClicked);
        $("#pts-btn-save").on("click", onSaveClicked);
        $("#pts-btn-apply").on("click", onApplyClicked);
        $("#pts-btn-delete").on("click", onDeleteClicked);

        // เมื่อเปลี่ยน Dropdown ให้จำค่าไว้เฉยๆ (ยังไม่สลับ Toggle จนกว่าจะกดปุ่ม 'โหลดมาใช้')
        $("#pts-preset-select").on("change", function() {
            extension_settings[extensionName].currentPreset = $(this).val();
            saveSettingsDebounced();
        });

        console.log(`[${extensionName}] ✅ Loaded successfully`);
    } catch (error) {
        console.error(`[${extensionName}] ❌ Failed to load:`, error);
    }
});
