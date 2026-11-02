import { fetchEquipments, createEquipment, updateEquipmentData, removeEquipment, fetchMaintenanceRecords, addMaintenanceRecord, updateMaintenanceRecord, deleteMaintenanceRecord, auth, provider, signInWithPopup, signOut, onAuthStateChanged } from './firestore-api.js';
import { renderDashboard, renderEquipmentList, toggleModal, populateForm, renderTimeline, toggleMaintModal, updateAuthUI } from './ui-manager.js';

let currentEquipments = [];
let currentDynamicHistory = [];
let currentSelectedEquipId = null;
let isAppAdmin = false;

// BẢO MẬT ADMIN: ĐIỀN EMAIL CỦA BẠN VÀO ĐÂY ĐỂ TRÁNH BỊ NGƯỜI KHÁC SỬA XÓA MÁY. 
const ADMIN_EMAILS = ['thanhtrong.yds@gmail.com']; 

function initApp() {
    setupEventListeners();
    
    // Theo dõi trạng thái đăng nhập tự động
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // Kiểm tra mảng phân quyền
            if (ADMIN_EMAILS.length === 0 || ADMIN_EMAILS.includes(user.email)) {
                isAppAdmin = true;
                updateAuthUI(user);
            } else {
                alert("Tài khoản Google này không có quyền Admin!");
                signOut(auth);
                isAppAdmin = false;
                updateAuthUI(null);
            }
        } else {
            isAppAdmin = false;
            updateAuthUI(null);
        }
        // Gọi hàm tải dữ liệu sau khi đã biết user có phải admin hay không
        loadData(); 
    });
}

async function loadData() {
    currentEquipments = await fetchEquipments();
    renderDashboard(currentEquipments);
    
    // Truyền biến isAppAdmin vào để ui-manager.js biết có nên vẽ nút Sửa/Xóa không
    renderEquipmentList(currentEquipments, handleEditClick, handleDeleteClick, handleCardClick, isAppAdmin);
    
    if (currentSelectedEquipId) {
        handleCardClick(currentSelectedEquipId);
    } else {
        renderTimeline(null); 
    }
}

function setupEventListeners() {
    /* --- LOGIN & LOGOUT --- */
    document.getElementById('btn-login').addEventListener('click', async () => {
        try {
            await signInWithPopup(auth, provider);
        } catch (error) {
            console.error("Lỗi đăng nhập:", error);
        }
    });

    document.getElementById('btn-logout').addEventListener('click', () => {
        signOut(auth);
    });

    /* --- SỰ KIỆN CHO MODAL THIẾT BỊ --- */
    document.getElementById('btn-add-new').addEventListener('click', () => {
        if (!isAppAdmin) return;
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

    // Sự kiện ấn nút "Xóa ảnh này" bên trong Modal
    document.getElementById('btn-remove-maint-image').addEventListener('click', () => {
        document.getElementById('maint-existing-image').value = ''; 
        document.getElementById('maint-current-image-container').classList.add('hidden'); 
    });

    // EVENT DELEGATION: Bắt click trong Timeline (Bao gồm Sửa, Xóa và Phóng to ảnh)
    document.getElementById('timeline-container').addEventListener('click', (e) => {
        const editBtn = e.target.closest('.btn-edit-maint');
        const deleteBtn = e.target.closest('.btn-delete-maint');
        const imageTarget = e.target.closest('.timeline-image-preview'); // Click vào ảnh
        
        // Mở ảnh phóng to
        if (imageTarget) {
            document.getElementById('zoomed-image').src = imageTarget.src;
            document.getElementById('image-modal').classList.remove('hidden');
        }

        // Logic Admin Edit
        if (editBtn && isAppAdmin) {
            const recordId = editBtn.getAttribute('data-id');
            const recordToEdit = currentDynamicHistory.find(r => r.id === recordId);
            if (recordToEdit) { 
                toggleMaintModal(true, currentSelectedEquipId, recordToEdit); 
            }
        }
        
        // Logic Admin Delete
        if (deleteBtn && isAppAdmin) {
            const recordId = deleteBtn.getAttribute('data-id');
            handleDeleteMaintRecord(currentSelectedEquipId, recordId);
        }
    });

    // Nút đóng ảnh phóng to
    document.getElementById('btn-close-image').addEventListener('click', () => {
        document.getElementById('image-modal').classList.add('hidden');
    });

    // Click ra ngoài khoảng trống để đóng tất cả các Modals
    window.addEventListener('click', (e) => {
        if (e.target === document.getElementById('equipment-modal')) toggleModal(false);
        if (e.target === document.getElementById('maint-modal')) toggleMaintModal(false);
        if (e.target === document.getElementById('image-modal')) document.getElementById('image-modal').classList.add('hidden');
    });
}

async function handleFormSubmit(e) {
    e.preventDefault();
    if (!isAppAdmin) {
        alert("Chỉ Admin mới có quyền thực hiện chức năng này!");
        return;
    }
    
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
                const ctx
