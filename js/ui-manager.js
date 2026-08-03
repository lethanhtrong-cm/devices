function getStatusDisplay(statusKey) {
    const statusMap = {
        'hoat_dong': { text: 'Hoạt động tốt', class: 'badge-hoat_dong' },
        'kiem_tra': { text: 'Cần kiểm tra', class: 'badge-kiem_tra' },
        'hong_hoc': { text: 'Đang hỏng hóc', class: 'badge-hong_hoc' }
    };
    return statusMap[statusKey] || { text: 'Không xác định', class: '' };
}

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
        
        card.addEventListener('click', () => {
            document.querySelectorAll('.equip-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            onCardClick(equip.id);
        });

        grid.appendChild(card);
    });

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

// Vẽ Timeline kết hợp dữ liệu tĩnh (từ form thiết bị) và dữ liệu động (từ sub-collection)
export function renderTimeline(equipment, dynamicRecords = []) {
    const container = document.getElementById('timeline-container');
    const btnAddMaint = document.getElementById('btn-add-maint');
    
    if (!equipment) {
        btnAddMaint.classList.add('hidden');
        container.innerHTML = `
            <div class="empty-timeline">
                <i class="fa-regular fa-hand-pointer"></i>
                <p>Nhấp vào một thiết bị ở danh sách bên trái để xem chi tiết lịch sử bảo trì.</p>
            </div>`;
        return;
    }

    // Hiển thị nút "Thêm Lịch Sử" và gắn ID máy hiện tại
    btnAddMaint.classList.remove('hidden');
    btnAddMaint.setAttribute('data-equip-id', equipment.id);

    let html = `
        <div class="timeline-header">
            <h3>Lịch Sử Bảo Trì: ${equipment.name}</h3>
            <p>Hãng SX: ${equipment.brand} | Model: ${equipment.model}</p>
        </div>
        <div class="timeline-list">
    `;

    // Nếu dynamicRecords là null, nghĩa là đang tải dữ liệu
    if (dynamicRecords === null) {
        html += `<div style="text-align:center; padding: 20px;"><i class="fa-solid fa-spinner fa-spin"></i> Đang tải dữ liệu lịch sử...</div>`;
    } else {
        // --- 1. Mốc động (từ chức năng thêm mới) ---
        dynamicRecords.forEach(record => {
            html += generateTimelineItemNode(
                record.date, 
                record.title, 
                record.notes, 
                'fa-wrench', 
                'icon-warning', 
                record.imageUrl
            );
        });

        // --- 2. Các mốc tĩnh (từ field cũ) ---
        if (equipment.nextMaint) {
            html += generateTimelineItemNode(equipment.nextMaint, 'Lịch bảo dưỡng định kỳ tiếp theo', 'Dự kiến kiểm tra tình trạng máy móc.', 'fa-calendar-check', 'icon-info');
        }
        if (equipment.lastMaint || equipment.notes) {
            const maintDate = equipment.lastMaint || 'Chưa xác định ngày';
            const maintDesc = equipment.notes || 'Bảo dưỡng / Ghi chú chung';
            html += generateTimelineItemNode(maintDate, 'Ghi chú / Bảo dưỡng tổng quan', maintDesc, 'fa-clipboard-list', 'icon-warning');
        }
        if (equipment.installDate) {
            html += generateTimelineItemNode(equipment.installDate, 'Lắp đặt & Bàn giao', 'Thiết bị bắt đầu được đưa vào sử dụng.', 'fa-truck-medical', 'icon-success');
        }
    }

    html += `</div>`;
    container.innerHTML = html;
}

function generateTimelineItemNode(dateRaw, title, desc, iconClass, colorClass, imageUrl = null) {
    const displayDate = formatDate(dateRaw) || dateRaw; 
    let imageHtml = '';
    
    // Nếu có ảnh, render thẻ img
    if (imageUrl) {
        imageHtml = `<img src="${imageUrl}" class="timeline-image-preview" alt="Ảnh bảo trì">`;
    }

    return `
        <div class="timeline-item">
            <div class="timeline-icon ${colorClass}"><i class="fa-solid ${iconClass}"></i></div>
            <div class="timeline-content">
                <span class="timeline-date">${displayDate}</span>
                <h4>${title}</h4>
                <p>${desc}</p>
                ${imageHtml}
            </div>
        </div>
    `;
}

// Modal thiết bị (Cũ)
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

// Modal thêm lịch sử bảo trì (Mới)
export function toggleMaintModal(show, equipId = '') {
    const modal = document.getElementById('maint-modal');
    if (show) {
        document.getElementById('maint-equip-id').value = equipId;
        
        // Gợi ý ngày hôm nay làm mặc định
        document.getElementById('maint-date').value = new Date().toISOString().split('T')[0];
        modal.classList.remove('hidden');
    } else {
        modal.classList.add('hidden');
        document.getElementById('maint-form').reset();
    }
}

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

function formatDate(dateString) {
    if (!dateString || !dateString.includes('-')) return '';
    const parts = dateString.split('-');
    if(parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`; 
    }
    return dateString;
}
