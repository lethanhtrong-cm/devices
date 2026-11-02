import { db } from './firebase-config.js';
import { 
    collection, 
    getDocs, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    doc 
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// HỖ TRỢ ĐĂNG NHẬP GOOGLE AUTHENTICATION
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

const COLLECTION_NAME = 'equipments';

// Khởi tạo Firebase Auth từ app hiện tại
export const auth = getAuth(db.app);
export const provider = new GoogleAuthProvider();
export { signInWithPopup, signOut, onAuthStateChanged };

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

// Thêm một record bảo trì vào sub-collection của thiết bị
export async function addMaintenanceRecord(equipId, recordData, imageBase64) {
    try {
        const maintCol = collection(db, COLLECTION_NAME, equipId, 'maintenance_history');
        const newRecord = {
            ...recordData,
            imageUrl: imageBase64 || null, 
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
        
        return records.sort((a, b) => new Date(b.date) - new Date(a.date));
    } catch (error) {
        console.error("Lỗi khi lấy dữ liệu lịch sử bảo trì: ", error);
        return [];
    }
}
