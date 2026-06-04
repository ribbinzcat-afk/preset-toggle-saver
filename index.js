import { extension_settings, getContext, loadExtensionSettings } from "../../../extensions.js";
import { saveSettingsDebounced } from "../../../../script.js";

const extensionName = "preset-toggle-saver";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;

const defaultSettings = {
    folders: {},       // โครงสร้างใหม่: { "AI Preset หลัก": { "กลุ่ม Toggle 1": {...}, "กลุ่ม Toggle 2": {...} } }
    lastSelected: {}   // จำว่าใน AI Preset นี้ คุณเลือกกลุ่ม Toggle ไหนค้างไว้ล่าสุด
};

function loadSettings() {
    extension_settings[extensionName] = extension_settings[extensionName] || {};
    if (Object.keys(extension_settings[extensionName]).length === 0) {
        Object.assign(extension_settings[extensionName], defaultSettings);
    }
    if (!extension_settings[extensionName].folders) extension_settings[extensionName].folders = {};
    if (!extension_settings[extensionName].lastSelected) extension_settings[extensionName].lastSelected = {};
}

// ดึงชื่อ AI Preset หลักที่กำลังใช้อยู่ (ชื่อกล่องใบใหญ่)
function getMainPresetName() {
    const visibleSelect = $('select[id^="settings_preset_"]:visible');
    if (visibleSelect.length > 0) {
        const presetName = visibleSelect.find(":selected").text();
        return presetName || "Unknown";
    }
    return "Unknown";
}

// อัปเดตรายชื่อใน Dropdown ให้แสดงเฉพาะกลุ่ม Toggle ที่อยู่ในกล่องใบนี้
function updateDropdown() {
    const mainPreset = getMainPresetName();
    const $select = $("#pts-preset-select");
    $select.empty();

    if (mainPreset === "Unknown") {
        $select.append(`<option value="">(ไม่พบ AI Preset หลัก)</option>`);
        return;
    }

    // ถ้ายังไม่มีโฟลเดอร์สำหรับ AI Preset นี้ ให้สร้างเตรียมไว้เลย
    if (!extension_settings[extensionName].folders[mainPreset]) {
        extension_settings[extensionName].folders[mainPreset] = {};
    }

    const toggleGroups = Object.keys(extension_settings[extensionName].folders[mainPreset]);

    if (toggleGroups.length === 0) {
        $select.append(`<option value="">(ยังไม่มีกลุ่ม Toggle ใน ${mainPreset})</option>`);
    } else {
        toggleGroups.forEach(name => {
            $select.append(`<option value="${name}">${name}</option>`);
        });

        // คืนค่าตัวที่เคยเลือกไว้ล่าสุดของกล่องใบนี้
        const lastUsed = extension_settings[extensionName].lastSelected[mainPreset];
        if (lastUsed && toggleGroups.includes(lastUsed)) {
            $select.val(lastUsed);
        }
    }
}

function onNewClicked() {
    const mainPreset = getMainPresetName();
    if (mainPreset === "Unknown") return;

    const newName = prompt(`ตั้งชื่อกลุ่ม Toggle ใหม่ (จะถูกเก็บไว้ใน ${mainPreset}) :`);
    if (!newName) return;

    if (extension_settings[extensionName].folders[mainPreset][newName]) {
        toastr.warning("ชื่อนี้มีอยู่แล้วในโฟลเดอร์นี้ค่ะ ลองใช้ชื่ออื่นนะคะ", "Toggle Presets");
        return;
    }

    // สร้างพื้นที่ว่างในโฟลเดอร์ของ AI Preset นี้
    extension_settings[extensionName].folders[mainPreset][newName] = {};
    extension_settings[extensionName].lastSelected[mainPreset] = newName;
    saveSettingsDebounced();

    updateDropdown();
    onSaveClicked(); // เซฟค่าปัจจุบันลงไปทันที
}

function onSaveClicked() {
    const mainPreset = getMainPresetName();
    const currentToggleName = $("#pts-preset-select").val();

    if (!currentToggleName) {
        toastr.warning("กรุณาสร้างหรือเลือกกลุ่ม Toggle ก่อนเซฟนะคะ", "Toggle Presets");
        return;
    }

    const toggleStates = {};
    let count = 0;

    $('#completion_prompt_manager .prompt-manager-toggle-action').each(function() {
        const isOn = $(this).hasClass('fa-toggle-on');
        const promptName = $(this).closest('li').find('.completion_prompt_manager_prompt_name').attr('data-pm-name');

        if (promptName) {
            toggleStates[promptName] = isOn;
            count++;
        }
    });

    extension_settings[extensionName].folders[mainPreset][currentToggleName] = toggleStates;
    saveSettingsDebounced();
    toastr.success(`บันทึกสถานะ ${count} Toggles ลงใน '${currentToggleName}' เรียบร้อยแล้วค่ะ`, "Toggle Presets");
}

function onApplyClicked() {
    const mainPreset = getMainPresetName();
    const currentToggleName = $("#pts-preset-select").val();

    if (!currentToggleName || !extension_settings[extensionName].folders[mainPreset]) return;

    const savedStates = extension_settings[extensionName].folders[mainPreset][currentToggleName];
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

    // จำไว้ว่าเราใช้กลุ่มนี้ล่าสุด
    extension_settings[extensionName].lastSelected[mainPreset] = currentToggleName;
    saveSettingsDebounced();

    if (changedCount > 0) {
        toastr.info(`ปรับสถานะ Toggles (${changedCount} รายการ)`, "Toggle Presets");
    } else {
        toastr.info(`Toggle ทุกอันอยู่ในสถานะที่ถูกต้องแล้วค่ะ`, "Toggle Presets");
    }
}

function onDeleteClicked() {
    const mainPreset = getMainPresetName();
    const currentToggleName = $("#pts-preset-select").val();

    if (!currentToggleName) return;

    if (confirm(`คุณแน่ใจนะคะว่าจะลบกลุ่ม Toggle '${currentToggleName}' ออกจาก ${mainPreset} ?`)) {
        delete extension_settings[extensionName].folders[mainPreset][currentToggleName];

        // ถ้าระบบจำว่าตัวที่ถูกลบคือตัวล่าสุดที่ใช้ ก็ให้ล้างค่าทิ้งด้วยค่ะ
        if (extension_settings[extensionName].lastSelected[mainPreset] === currentToggleName) {
            delete extension_settings[extensionName].lastSelected[mainPreset];
        }

        saveSettingsDebounced();
        updateDropdown();
        toastr.success(`ลบ '${currentToggleName}' เรียบร้อยแล้วค่ะ`, "Toggle Presets");
    }
}

// เมื่อ AI Preset หลักเปลี่ยน ให้เปลี่ยนกล่องความทรงจำ (Dropdown) ตาม
function onMainPresetChanged() {
    updateDropdown();

    // หากต้องการให้มันโหลด Toggle อัตโนมัติตามตัวล่าสุดที่เคยเลือกไว้ในกล่องนี้ ให้เอา // ด้านล่างออกค่ะ
    // setTimeout(onApplyClicked, 1000);
}

jQuery(async () => {
    console.log(`[${extensionName}] Loading...`);

    try {
        const settingsHtml = await $.get(`${extensionFolderPath}/example.html`);
        $("#extensions_settings2").append(settingsHtml);

        // ปรับปรุง UI ให้ยืดหยุ่นและพอดีกับหน้าจอมากขึ้นค่ะ
        const mainUiHtml = `
            <div id="pts-standalone-ui" style="margin: 15px 0; padding: 15px; background: var(--SmartThemeBlurTintColor); border: 1px solid var(--SmartThemeBorderColor); border-radius: 8px; width: 100%; box-sizing: border-box; display: flex; flex-direction: column; gap: 10px;">
                <h4 style="margin: 0;"><span class="fa-solid fa-folder-open"></span> Toggle Presets</h4>

                <div style="display: flex; gap: 5px; align-items: center; width: 100%;">
                    <select id="pts-preset-select" class="text_pole" style="flex-grow: 1; width: 100%;"></select>
                    <div id="pts-btn-new" class="menu_button fa-solid fa-plus" title="สร้างกลุ่ม Toggle ใหม่ใน Preset นี้" style="flex-shrink: 0;"></div>
                </div>

                <div style="display: flex; gap: 5px; width: 100%;">
                    <input id="pts-btn-apply" class="menu_button" type="button" value="โหลดมาใช้" style="flex: 1;" />
                    <input id="pts-btn-save" class="menu_button" type="button" value="เซฟทับ" style="flex: 1;" />
                    <div id="pts-btn-delete" class="menu_button fa-solid fa-trash redWarningBG" title="ลบกลุ่มนี้" style="padding: 10px; flex-shrink: 0;"></div>
                </div>

                <small style="color: var(--SmartThemeBodyColor); opacity: 0.7; margin-top: 5px;">* กลุ่ม Toggle เหล่านี้ถูกจัดเก็บแยกตาม AI Preset หลักแต่ละตัวค่ะ</small>
            </div>
        `;

        $(mainUiHtml).insertBefore("#completion_prompt_manager");

        loadSettings();

        // รอให้หน้าต่างโหลดเสร็จก่อนค่อยดึงข้อมูลมาแสดง
        setTimeout(updateDropdown, 1000);

        $("#pts-btn-new").on("click", onNewClicked);
        $("#pts-btn-save").on("click", onSaveClicked);
        $("#pts-btn-apply").on("click", onApplyClicked);
        $("#pts-btn-delete").on("click", onDeleteClicked);

        // เมื่อคุณเปลี่ยน Dropdown ของเรา มันจะแค่จำไว้ว่าคุณเลือกเล่มไหนล่าสุด
        $("#pts-preset-select").on("change", function() {
            const mainPreset = getMainPresetName();
            const selectedName = $(this).val();
            if (mainPreset !== "Unknown" && selectedName) {
                extension_settings[extensionName].lastSelected[mainPreset] = selectedName;
                saveSettingsDebounced();
            }
        });

        // ดักจับตอนที่ AI Preset หลักของ SillyTavern เปลี่ยน
        $(document).on("change", 'select[id^="settings_preset_"]', () => {
             setTimeout(onMainPresetChanged, 500);
        });
        $(document).on("click", '.api-connection-settings', () => {
             setTimeout(onMainPresetChanged, 1000);
        });

        console.log(`[${extensionName}] ✅ Loaded successfully`);
    } catch (error) {
        console.error(`[${extensionName}] ❌ Failed to load:`, error);
    }
});
