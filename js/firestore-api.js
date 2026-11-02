import { db } from './firebase-config.js';
import { 
    collection, 
    getDocs, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    doc 
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

const COLLECTION_NAME = 'equipments';

export const auth = getAuth(db.app);
export const provider = new GoogleAuthProvider();
export { signInWithPopup, signOut, onAuthStateChanged };

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

export async function createEquipment(equipmentData) {
    try {
        const docRef = await addDoc(collection(db, COLLECTION_NAME), equipmentData);
        return docRef.id;
    } catch (error) {
        console.error("Lỗi khi thêm thiết bị: ", error);
        throw error;
    }
}

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

// --- QUẢN LÝ LỊCH SỬ BẢO TRÌ ---

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

export async function updateMaintenanceRecord(equipId, recordId, recordData, imageBase64, keepExistingImage) {
    try {
        const recordRef = doc(db, COLLECTION_NAME, equipId, 'maintenance_history', recordId);
        const updateData = { ...recordData };

        if (imageBase64 !== null) {
            updateData.imageUrl = imageBase64; // Đổi ảnh mới
        } else if (!keepExistingImage) {
            updateData.imageUrl = null; // Admin đã chủ động xóa ảnh
        }
        
        await updateDoc(recordRef, updateData);
        return true;
    } catch (error) {
        console.error("Lỗi khi cập nhật lịch sử bảo trì: ", error);
        throw error;
    }
}

export async function deleteMaintenanceRecord(equipId, recordId) {
    try {
        const recordRef = doc(db, COLLECTION_NAME, equipId, 'maintenance_history', recordId);
        await deleteDoc(recordRef);
        return true;
    } catch (error) {
        console.error("Lỗi khi xóa lịch sử bảo trì: ", error);
        throw error;
    }
}
