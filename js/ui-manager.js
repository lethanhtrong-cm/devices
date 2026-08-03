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

// Cập nhật: Vẽ danh sách Card thiết bị ra HTML và gắn sự kiện Card Click
export function renderEquipmentList(equipments, onEdit, onDelete, onCardClick) {
    const grid = document.getElementById('equipment-grid');
    grid.innerHTML = ''; 

    if (equipments.length === 0) {
        grid.innerHTML = '<div class="loading-text">Chưa có thiết bị nào trong cơ sở dữ liệu.</div>';
        return;
    }

    equipments.forEach(equip => {
        const statusDisplay = getStatusDisplay(equip.status);
        const card = document.createElement('div');
        card.className = 'equip-card';
        card.setAttribute('data-id', equip.id);
        
        card.innerHTML = `
            <div class="equip-status-badge ${statusDisplay.class}">${statusDisplay.text}</div>
            <h3>${equip.name}</h3>
            <p class="equip-model">${equip.brand} - Model: ${equip.model}</p>
            <ul class="equip-details">
                <li><strong>Serial:</strong> <span>${equip.serial}</span></li>
                <li><strong>Năm SX:</strong> <span>${equip.year}</span></li>
            </ul>
            <div class="card-actions">
                <button class="btn btn-edit edit-btn" data-id="${equip.id}"><i class="fa-solid fa-pen"></i> Sửa</button>
                <button class="btn btn-delete delete-btn" data-id="${equip.id}"><i class="fa-solid fa-trash"></i> Xóa</button>
            </div>
        `;
        
        // Sự kiện click toàn bộ thẻ để xem Timeline
        card.addEventListener('click', () => {
            // Xóa class selected của các thẻ khác và thêm vào thẻ hiện tại
            document.querySelectorAll('.equip-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            onCardClick(equip.id);
        });

        grid.appendChild(card);
    });

    // Gắn sự kiện cho các nút Sửa/Xóa. Dùng e.stopPropagation() để không kích hoạt click thẻ khi ấn nút
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); 
            onEdit(e.currentTarget.getAttribute('data-id'));
        });
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            onDelete(e.currentTarget.getAttribute('data-id'));
        });
    });
}

// TÍNH NĂNG MỚI: Vẽ Timeline Lịch sử bảo trì
export function renderTimeline(equipment) {
    const container = document.getElementById('timeline-container');
    
    // Nếu không có thiết bị hoặc bị xóa, reset về trạng thái trống
    if (!equipment) {
        container.innerHTML = `
            <div class="empty-timeline">
                <i class="fa-regular fa-hand-pointer"></i>
                <p>Nhấp vào một thiết bị ở danh sách bên trái để xem chi tiết lịch sử bảo trì.</p>
            </div>`;
        return;
    }

    // Header của Timeline
    let html = `
        <div class="timeline-header">
            <h3>Lịch Sử Bảo Trì: ${equipment.name}</h3>
            <p>Hãng SX: ${equipment.brand} | Model: ${equipment.model}</p>
        </div>
        <div class="timeline-list">
    `;

    // Mốc 1: Ngày lắp đặt
    if (equipment.installDate) {
        html += generateTimelineItemNode(equipment.installDate, 'Lắp đặt & Bàn giao', 'Thiết bị bắt đầu được đưa vào sử dụng.', 'fa-truck-medical', 'icon-success');
    }

    // Mốc 2: Lịch sử sửa chữa/Ghi chú (Ưu tiên lấy thông tin từ textarea Notes)
    if (equipment.lastMaint || equipment.notes) {
        const maintDate = equipment.lastMaint || 'Chưa xác định ngày';
        const maintDesc = equipment.notes || 'Đã thực hiện bảo dưỡng, không có ghi chú chi tiết.';
        html += generateTimelineItemNode(maintDate, 'Lịch sử Sửa chữa / Bảo dưỡng', maintDesc, 'fa-wrench', 'icon-warning');
    }

    // Mốc 3: Lịch bảo dưỡng tiếp theo
    if (equipment.nextMaint) {
        html += generateTimelineItemNode(equipment.nextMaint, 'Lịch bảo dưỡng định kỳ tiếp theo', 'Cần kiểm tra tình trạng hoạt động và linh kiện tiêu hao.', 'fa-calendar-check', 'icon-info');
    }

    html += `</div>`;
    container.innerHTML = html;
}

// Hàm hỗ trợ tạo chuỗi HTML cho mỗi mốc Timeline
function generateTimelineItemNode(dateRaw, title, desc, iconClass, colorClass) {
    const displayDate = formatDate(dateRaw) || dateRaw; // Thử format ngày, nếu không được thì in raw
    return `
        <div class="timeline-item">
            <div class="timeline-icon ${colorClass}"><i class="fa-solid ${iconClass}"></i></div>
            <div class="timeline-content">
                <span class="timeline-date">${displayDate}</span>
                <h4>${title}</h4>
                <p>${desc}</p>
            </div>
        </div>
    `;
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

// Format lại ngày tháng để hiển thị UI (YYYY-MM-DD sang DD/MM/YYYY)
function formatDate(dateString) {
    if (!dateString || !dateString.includes('-')) return '';
    const parts = dateString.split('-');
    if(parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`; // DD/MM/YYYY
    }
    return dateString;
}
