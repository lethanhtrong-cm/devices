import { fetchEquipments, createEquipment, updateEquipmentData, removeEquipment } from './firestore-api.js';
import { renderDashboard, renderEquipmentList, toggleModal, populateForm, renderTimeline } from './ui-manager.js';

let currentEquipments = [];

// Hàm khởi tạo ứng dụng
async function initApp() {
    await loadData();
    setupEventListeners();
}

// Tải dữ liệu từ Firebase và Render lên UI
async function loadData() {
    currentEquipments = await fetchEquipments();
    renderDashboard(currentEquipments);
    
    // Truyền thêm hàm xử lý handleCardClick vào List
    renderEquipmentList(currentEquipments, handleEditClick, handleDeleteClick, handleCardClick);
    
    // Reset Timeline nếu dữ liệu reload
    renderTimeline(null); 
}

// Thiết lập các sự kiện tương tác
function setupEventListeners() {
    // Mở modal thêm mới
    document.getElementById('btn-add-new').addEventListener('click', () => {
        document.getElementById('modal-title').innerText = "Thêm Thiết Bị Mới";
        toggleModal(true);
    });

    // Đóng modal
    document.getElementById('btn-close-modal').addEventListener('click', () => toggleModal(false));
    
    // Đóng khi click ra ngoài modal
    window.addEventListener('click', (e) => {
        if (e.target === document.getElementById('equipment-modal')) {
            toggleModal(false);
        }
    });

    // Xử lý Submit Form (Add hoặc Edit)
    document.getElementById('equipment-form').addEventListener('submit', handleFormSubmit);
}

// Xử lý logic Submit Form
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
            // Edit
            await updateEquipmentData(id, formData);
            alert('Cập nhật thông tin thành công!');
        } else {
            // Add new
            await createEquipment(formData);
            alert('Thêm thiết bị mới thành công!');
        }
        
        toggleModal(false);
        await loadData(); // Reload UI
    } catch (error) {
        alert('Có lỗi xảy ra, vui lòng thử lại sau.');
    }
}

// Handle: Khi click vào bất kỳ vị trí nào trên thẻ thiết bị (Ngoại trừ nút)
function handleCardClick(id) {
    const equip = currentEquipments.find(e => e.id === id);
    if (equip) {
        renderTimeline(equip);
    }
}

// Handle nút Edit trên từng thẻ máy
function handleEditClick(id) {
    const equip = currentEquipments.find(e => e.id === id);
    if (equip) {
        populateForm(equip);
        toggleModal(true);
    }
}

// Handle nút Xóa trên từng thẻ máy
async function handleDeleteClick(id) {
    if (confirm('Bạn có chắc chắn muốn xóa dữ liệu máy này khỏi hệ thống? Hành động này không thể hoàn tác.')) {
        try {
            await removeEquipment(id);
            await loadData(); // Load lại toàn bộ (bao gồm cả reset màn hình timeline bên phải)
        } catch (error) {
            alert('Lỗi khi xóa thiết bị.');
        }
    }
}

// Khởi chạy App khi DOM đã sẵn sàng
document.addEventListener('DOMContentLoaded', initApp);
