import { fetchEquipments, createEquipment, updateEquipmentData, removeEquipment, fetchMaintenanceRecords, addMaintenanceRecord } from './firestore-api.js';
import { renderDashboard, renderEquipmentList, toggleModal, populateForm, renderTimeline, toggleMaintModal } from './ui-manager.js';

let currentEquipments = [];
let currentSelectedEquipId = null;

async function initApp() {
    await loadData();
    setupEventListeners();
}

async function loadData() {
    currentEquipments = await fetchEquipments();
    renderDashboard(currentEquipments);
    renderEquipmentList(currentEquipments, handleEditClick, handleDeleteClick, handleCardClick);
    
    // Nếu đang có thẻ được chọn, load lại timeline của thẻ đó. Nếu không, reset timeline.
    if (currentSelectedEquipId) {
        handleCardClick(currentSelectedEquipId);
    } else {
        renderTimeline(null); 
    }
}

function setupEventListeners() {
    /* --- SỰ KIỆN CHO MODAL THIẾT BỊ --- */
    document.getElementById('btn-add-new').addEventListener('click', () => {
        document.getElementById('modal-title').innerText = "Thêm Thiết Bị Mới";
        toggleModal(true);
    });
    document.getElementById('btn-close-modal').addEventListener('click', () => toggleModal(false));
    document.getElementById('equipment-form').addEventListener('submit', handleFormSubmit);

    /* --- SỰ KIỆN CHO MODAL BẢO TRÌ --- */
    document.getElementById('btn-add-maint').addEventListener('click', (e) => {
        const equipId = e.currentTarget.getAttribute('data-equip-id');
        toggleMaintModal(true, equipId);
    });
    document.getElementById('btn-close-maint-modal').addEventListener('click', () => toggleMaintModal(false));
    document.getElementById('maint-form').addEventListener('submit', handleMaintSubmit);

    // Đóng modal khi click ra ngoài (Áp dụng chung)
    window.addEventListener('click', (e) => {
        if (e.target === document.getElementById('equipment-modal')) toggleModal(false);
        if (e.target === document.getElementById('maint-modal')) toggleMaintModal(false);
    });
}

// Submit Form Thiết bị
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const id = document.getElementById('equip-id').value;
    const formData = {
        name: document.getElementById('equip-name').value,
        model: document.getElementById('equip-model').value,
        brand: document.getElementById('equip-brand').value,
        serial: document.getElementById('equip-serial').value,
        year: parseInt(document.getElementById('equip-year').value),
        installDate: document.getElementById('equip-install').value,
        status: document.getElementById('equip-status').value,
        lastMaint: document.getElementById('equip-last-maint').value,
        nextMaint: document.getElementById('equip-next-maint').value,
        notes: document.getElementById('equip-notes').value
    };

    try {
        if (id) {
            await updateEquipmentData(id, formData);
        } else {
            await createEquipment(formData);
        }
        toggleModal(false);
        await loadData();
    } catch (error) {
        alert('Có lỗi xảy ra khi lưu thiết bị.');
    }
}

// Hàm hỗ trợ nén ảnh và chuyển thành Base64 để lưu vào Firestore (tránh giới hạn 1MB)
function compressImageToBase64(file, maxWidth = 800, quality = 0.7) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                // Trả về chuỗi Base64 định dạng JPEG nén
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.onerror = (error) => reject(error);
        };
        reader.onerror = (error) => reject(error);
    });
}

// Submit Form Thêm Lịch sử Bảo trì
async function handleMaintSubmit(e) {
    e.preventDefault();
    const btnSubmit = document.getElementById('btn-submit-maint');
    
    const equipId = document.getElementById('maint-equip-id').value;
    const recordData = {
        date: document.getElementById('maint-date').value,
        title: document.getElementById('maint-title').value,
        notes: document.getElementById('maint-notes').value,
    };
    
    const imageInput = document.getElementById('maint-image');
    let imageBase64 = null;

    try {
        const originalText = btnSubmit.innerHTML;
        btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang xử lý...';
        btnSubmit.disabled = true;

        // Nếu có chọn ảnh, tiến hành nén ảnh trước khi lưu
        if (imageInput.files.length > 0) {
            imageBase64 = await compressImageToBase64(imageInput.files[0]);
        }

        await addMaintenanceRecord(equipId, recordData, imageBase64);
        
        // Reset form & UI
        toggleMaintModal(false);
        btnSubmit.innerHTML = originalText;
        btnSubmit.disabled = false;
        
        // Reload lại riêng phần Timeline của máy đó
        handleCardClick(equipId);
    } catch (error) {
        console.error(error);
        alert('Lỗi khi lưu lịch sử. Vui lòng kiểm tra lại kết nối mạng.');
        btnSubmit.innerHTML = '<i class="fa-solid fa-save"></i> Lưu Lịch Sử';
        btnSubmit.disabled = false;
    }
}

// Click vào thẻ Card: Tải & hiển thị Timeline chi tiết
async function handleCardClick(id) {
    currentSelectedEquipId = id;
    const equip = currentEquipments.find(e => e.id === id);
    
    if (equip) {
        // Render tạm trạng thái Loading (null) cho history
        renderTimeline(equip, null); 
        
        try {
            // Lấy dữ liệu động từ sub-collection
            const dynamicHistory = await fetchMaintenanceRecords(id);
            renderTimeline(equip, dynamicHistory);
        } catch (error) {
            renderTimeline(equip, []); // Nếu lỗi, vẫn render ra form gốc
        }
    }
}

function handleEditClick(id) {
    const equip = currentEquipments.find(e => e.id === id);
    if (equip) {
        populateForm(equip);
        toggleModal(true);
    }
}

async function handleDeleteClick(id) {
    if (confirm('Bạn có chắc chắn muốn xóa dữ liệu máy này khỏi hệ thống? Hành động này không thể hoàn tác.')) {
        try {
            await removeEquipment(id);
            if (currentSelectedEquipId === id) currentSelectedEquipId = null;
            await loadData();
        } catch (error) {
            alert('Lỗi khi xóa thiết bị.');
        }
    }
}

document.addEventListener('DOMContentLoaded', initApp);
