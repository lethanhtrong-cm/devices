// Hàm chuyển đổi key trạng thái sang Text và Label hiển thị
function getStatusDisplay(statusKey) {
    const statusMap = {
        'hoat_dong': { text: 'Hoạt động tốt', class: 'badge-hoat_dong' },
        'kiem_tra': { text: 'Cần kiểm tra', class: 'badge-kiem_tra' },
        'hong_hoc': { text: 'Đang hỏng hóc', class: 'badge-hong_hoc' }
    };
    return statusMap[statusKey] || { text: 'Không xác định', class: '' };
}

// Cập nhật thống kê Dashboard
export function renderDashboard(equipments) {
    const total = equipments.length;
    const active = equipments.filter(e => e.status === 'hoat_dong').length;
    const warning = equipments.filter(e => e.status === 'kiem_tra').length;
    const danger = equipments.filter(e => e.status === 'hong_hoc').length;

    document.getElementById('stat-total').textContent = total;
    document.getElementById('stat-active').textContent = active;
    document.getElementById('stat-warning').textContent = warning;
    document.getElementById('stat-danger').textContent = danger;
}

// Vẽ danh sách Card thiết bị ra HTML
export function renderEquipmentList(equipments, onEdit, onDelete) {
    const grid = document.getElementById('equipment-grid');
    grid.innerHTML = ''; // Clear loading text hoặc data cũ

    if (equipments.length === 0) {
        grid.innerHTML = '<div class="loading-text">Chưa có thiết bị nào trong cơ sở dữ liệu.</div>';
        return;
    }

    equipments.forEach(equip => {
        const statusDisplay = getStatusDisplay(equip.status);
        const card = document.createElement('div');
        card.className = 'equip-card';
        
        card.innerHTML = `
            <div class="equip-status-badge ${statusDisplay.class}">${statusDisplay.text}</div>
            <h3>${equip.name}</h3>
            <p class="equip-model">${equip.brand} - Model: ${equip.model}</p>
            <ul class="equip-details">
                <li><strong>Serial:</strong> <span>${equip.serial}</span></li>
                <li><strong>Năm SX:</strong> <span>${equip.year}</span></li>
                <li><strong>Ngày lắp đặt:</strong> <span>${formatDate(equip.installDate)}</span></li>
                <li><strong>Bảo dưỡng kỳ tới:</strong> <span>${formatDate(equip.nextMaint) || 'Chưa xếp lịch'}</span></li>
            </ul>
            <div class="card-actions">
                <button class="btn btn-edit edit-btn" data-id="${equip.id}"><i class="fa-solid fa-pen"></i> Sửa</button>
                <button class="btn btn-delete delete-btn" data-id="${equip.id}"><i class="fa-solid fa-trash"></i> Xóa</button>
            </div>
        `;
        grid.appendChild(card);
    });

    // Gắn sự kiện cho các nút vừa được tạo ra
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => onEdit(e.currentTarget.getAttribute('data-id')));
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => onDelete(e.currentTarget.getAttribute('data-id')));
    });
}

// Hiển thị và Ẩn Modal
export function toggleModal(show) {
    const modal = document.getElementById('equipment-modal');
    if (show) {
        modal.classList.remove('hidden');
    } else {
        modal.classList.add('hidden');
        document.getElementById('equipment-form').reset();
        document.getElementById('equip-id').value = '';
    }
}

// Đổ dữ liệu vào Form khi Edit
export function populateForm(equipment) {
    document.getElementById('equip-id').value = equipment.id;
    document.getElementById('equip-name').value = equipment.name;
    document.getElementById('equip-model').value = equipment.model;
    document.getElementById('equip-brand').value = equipment.brand;
    document.getElementById('equip-serial').value = equipment.serial;
    document.getElementById('equip-year').value = equipment.year;
    document.getElementById('equip-install').value = equipment.installDate;
    document.getElementById('equip-status').value = equipment.status;
    document.getElementById('equip-last-maint').value = equipment.lastMaint || '';
    document.getElementById('equip-next-maint').value = equipment.nextMaint || '';
    document.getElementById('equip-notes').value = equipment.notes || '';
    
    document.getElementById('modal-title').innerText = "Cập Nhật Thông Tin Máy";
}

// Format lại ngày tháng để hiển thị UI
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
}
