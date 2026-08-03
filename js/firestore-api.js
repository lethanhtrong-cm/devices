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
