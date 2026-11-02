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

// Nhận thêm tham số isAdmin để quyết định vẽ nút sửa/xóa hay không
export function renderEquipmentList(equipments, onEdit, onDelete, onCardClick, isAdmin = false) {
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
        
        let cardHTML = `
            <div class="equip-status-badge ${statusDisplay.class}">${statusDisplay.text}</div>
            <h3>${equip.name}</h3>
            <p class="equip-model">${equip.brand} - Model: ${equip.model}</p>
            <ul class="equip-details">
                <li><strong>Serial:</strong> <span>${equip.serial}</span></li>
                <li><strong>Năm SX:</strong> <span>${equip.year}</span></li>
            </ul>
        `;

        // Chỉ Admin mới thấy nút Xóa và Sửa
        if (isAdmin) {
            cardHTML += `
            <div class="card-actions">
                <button class="btn btn-edit edit-btn" data-id="${equip.id}"><i class="fa-solid fa-pen"></i> Sửa</button>
                <button class="btn btn-delete delete-btn" data-id="${equip.id}"><i class="fa-solid fa-trash"></i> Xóa</button>
            </div>`;
        }

        card.innerHTML = cardHTML;
        
        card.addEventListener('click', () => {
            document.querySelectorAll('.equip-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            onCardClick(equip.id);
        });

        grid.appendChild(card);
    });

    if (isAdmin) {
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
}

// Cập nhật giao diện Đăng Nhập
export function updateAuthUI(user) {
    const userInfo = document.getElementById('user-info');
    const btnLogin = document.getElementById('btn-login');
    const btnAddNew = document.getElementById('btn-add-new');

    if (user) {
        // Đã đăng nhập: Hiện avatar, tên, nút Đăng xuất & nút Thêm máy
        userInfo.classList.remove('hidden');
        document.getElementById('user-name').textContent = user.displayName || 'Admin';
        document.getElementById('user-avatar').src = user.photoURL || '';
        btnLogin.classList.add('hidden');
        btnAddNew.classList.remove('hidden');
    } else {
        // Chưa đăng nhập: Hiện nút Login, Ẩn các nút Admin
        userInfo.classList.add('hidden');
        btnLogin.classList.remove('hidden');
        btnAddNew.classList.add('hidden');
    }
}

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

    // Luôn luôn hiển thị nút Thêm Lịch Sử (theo yêu cầu không cần Auth)
    btnAddMaint.classList.remove('hidden');
    btnAddMaint.setAttribute('data-equip-id', equipment.id);

    const statusDisplay = getStatusDisplay(equipment.status);

    let html = `
        <div class="timeline-header">
            <h3 style="margin-bottom: 10px;"><i class="fa-solid fa-display"></i> Thông Tin Chi Tiết: ${equipment.name}</h3>
            
            <div class="machine-details-panel">
                <div class="info-group"><span>Hãng sản xuất</span><strong>${equipment.brand}</strong></div>
                <div class="info-group"><span>Model</span><strong>${equipment.model}</strong></div>
                <div class="info-group"><span>Số Serial</span><strong>${equipment.serial}</strong></div>
                <div class="info-group"><span>Năm sản xuất</span><strong>${equipment.year}</strong></div>
                <div class="info-group"><span>Ngày lắp đặt</span><strong>${formatDate(equipment.installDate) || 'Chưa cập nhật'}</strong></div>
                <div class="info-group">
                    <span>Tình trạng hiện tại</span>
                    <strong class="${statusDisplay.class}" style="padding: 3px 10px; border-radius: 12px; color: #fff; font-size: 0.8rem; display: inline-block; margin-top: 3px;">${statusDisplay.text}</strong>
                </div>
            </div>
        </div>
        
        <h3 class="timeline-title-sub"><i class="fa-solid fa-clock-rotate-left"></i> Dòng Thời Gian Sửa Chữa & Bảo Trì</h3>
        <div class="timeline-list">
    `;

    if (dynamicRecords === null) {
        html += `<div style="text-align:center; padding: 20px;"><i class="fa-solid fa-spinner fa-spin"></i> Đang tải dữ liệu lịch sử...</div>`;
    } else {
        dynamicRecords.forEach(record => {
            html += generateTimelineItemNode(record.date, record.title, record.notes, 'fa-wrench', 'icon-warning', record.imageUrl);
        });

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

export function toggleMaintModal(show, equipId = '') {
    const modal = document.getElementById('maint-modal');
    if (show) {
        document.getElementById('maint-equip-id').value = equipId;
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
