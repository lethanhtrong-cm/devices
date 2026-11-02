import { db } from './firebase-config.js';
import { 
    collection, 
    getDocs, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    doc 
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const COLLECTION_NAME = 'equipments';

// Lấy toàn bộ danh sách thiết bị
export async function fetchEquipments() {
    try {
        const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
        const equipments = [];
        querySnapshot.forEach((doc) => {
            equipments.push({ id: doc.id, ...doc.data() });
        });
        return equipments;
    } catch (error) {
        console.error("Lỗi khi lấy dữ liệu: ", error);
        return [];
    }
}

// Thêm thiết bị mới
export async function createEquipment(equipmentData) {
    try {
        const docRef = await addDoc(collection(db, COLLECTION_NAME), equipmentData);
        return docRef.id;
    } catch (error) {
        console.error("Lỗi khi thêm thiết bị: ", error);
        throw error;
    }
}

// Cập nhật thông tin thiết bị
export async function updateEquipmentData(id, equipmentData) {
    try {
        const equipmentRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(equipmentRef, equipmentData);
        return true;
    } catch (error) {
        console.error("Lỗi khi cập nhật thiết bị: ", error);
        throw error;
    }
}

// Xóa thiết bị
export async function removeEquipment(id) {
    try {
        const equipmentRef = doc(db, COLLECTION_NAME, id);
        await deleteDoc(equipmentRef);
        return true;
    } catch (error) {
        console.error("Lỗi khi xóa thiết bị: ", error);
        throw error;
    }
}

// --- QUẢN LÝ LỊCH SỬ BẢO TRÌ (Lưu ảnh Base64 trực tiếp vào Firestore) ---

// Thêm một record bảo trì vào sub-collection của thiết bị
export async function addMaintenanceRecord(equipId, recordData, imageBase64) {
    try {
        // Tạo Document trong sub-collection "maintenance_history"
        const maintCol = collection(db, COLLECTION_NAME, equipId, 'maintenance_history');
        const newRecord = {
            ...recordData,
            imageUrl: imageBase64 || null, // Lưu trực tiếp chuỗi Base64 thay vì URL của Storage
            createdAt: new Date().toISOString()
        };
        
        await addDoc(maintCol, newRecord);
        return true;
    } catch (error) {
        console.error("Lỗi khi lưu lịch sử bảo trì: ", error);
        throw error;
    }
}

// Lấy danh sách lịch sử bảo trì của một thiết bị
export async function fetchMaintenanceRecords(equipId) {
    try {
        const maintCol = collection(db, COLLECTION_NAME, equipId, 'maintenance_history');
        const querySnapshot = await getDocs(maintCol);
        const records = [];
        querySnapshot.forEach(doc => {
            records.push({ id: doc.id, ...doc.data() });
        });
        
        // Sắp xếp theo ngày giảm dần (Mới nhất lên đầu)
        return records.sort((a, b) => new Date(b.date) - new Date(a.date));
    } catch (error) {
        console.error("Lỗi khi lấy dữ liệu lịch sử bảo trì: ", error);
        return [];
    }
}
