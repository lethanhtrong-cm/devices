import { fetchEquipments, createEquipment, updateEquipmentData, removeEquipment, fetchMaintenanceRecords, addMaintenanceRecord, auth, provider, signInWithPopup, signOut, onAuthStateChanged } from './firestore-api.js';
import { renderDashboard, renderEquipmentList, toggleModal, populateForm, renderTimeline, toggleMaintModal, updateAuthUI } from './ui-manager.js';

let currentEquipments = [];
let currentSelectedEquipId = null;
let isAppAdmin = false;

// BẢO MẬT ADMIN: ĐIỀN EMAIL CỦA BẠN VÀO ĐÂY ĐỂ TRÁNH BỊ NGƯỜI KHÁC SỬA XÓA MÁY. 
// VÍ DỤ: const ADMIN_EMAILS = ['phanvantruong@gmail.com', 'admin.khoa@gmail.com'];
// Nếu để mảng rỗng [], thì MỌI TÀI KHOẢN Google đăng nhập đều có quyền Admin.
const ADMIN_EMAILS = [];

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

    /* --- SỰ KIỆN CHO MODAL BẢO TRÌ (Ai cũng có thể bấm được) --- */
    document.getElementById('btn-add-maint').addEventListener('click', (e) => {
        const equipId = e.currentTarget.getAttribute('data-equip-id');
        toggleMaintModal(true, equipId);
    });
    document.getElementById('btn-close-maint-modal').addEventListener('click', () => toggleMaintModal(false));
    document.getElementById('maint-form').addEventListener('submit', handleMaintSubmit);

    window.addEventListener('click', (e) => {
        if (e.target === document.getElementById('equipment-modal')) toggleModal(false);
        if (e.target === document.getElementById('maint-modal')) toggleMaintModal(false);
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
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.onerror = (error) => reject(error);
        };
        reader.onerror = (error) => reject(error);
    });
}

// Chức năng này công khai (Không cần xét isAppAdmin)
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

        if (imageInput.files.length > 0) {
            imageBase64 = await compressImageToBase64(imageInput.files[0]);
        }

        await addMaintenanceRecord(equipId, recordData, imageBase64);
        
        toggleMaintModal(false);
        btnSubmit.innerHTML = originalText;
        btnSubmit.disabled = false;
        
        handleCardClick(equipId);
    } catch (error) {
        console.error(error);
        alert('Lỗi khi lưu lịch sử. Vui lòng kiểm tra lại.');
        btnSubmit.innerHTML = '<i class="fa-solid fa-save"></i> Lưu Lịch Sử';
        btnSubmit.disabled = false;
    }
}

async function handleCardClick(id) {
    currentSelectedEquipId = id;
    const equip = currentEquipments.find(e => e.id === id);
    
    if (equip) {
        renderTimeline(equip, null); 
        try {
            const dynamicHistory = await fetchMaintenanceRecords(id);
            renderTimeline(equip, dynamicHistory);
        } catch (error) {
            renderTimeline(equip, []);
        }
    }
}

function handleEditClick(id) {
    if (!isAppAdmin) return;
    const equip = currentEquipments.find(e => e.id === id);
    if (equip) {
        populateForm(equip);
        toggleModal(true);
    }
}

async function handleDeleteClick(id) {
    if (!isAppAdmin) return;
    if (confirm('Bạn có chắc chắn muốn xóa dữ liệu máy này khỏi hệ thống?')) {
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
