import { collection, addDoc, getDocs } from "firebase/firestore";
import { db } from "./firebase";

export async function testFirestoreConnection() {
    try {
        console.log("Firestoreへの接続テストを開始します...");

        const docRef = await addDoc(collection(db, "test_collection"), {
            message: "Firebaseとの接続に成功しました!",
            createAt: new Date()
        });
        console.log("データの書き込みに成功, ID: ", docRef.id);

        const querySnapshot = await getDocs(collection(db, "test_collection"));
        console.log("データの読み込みに成功! 保存されているデータ一覧: ");
        
        querySnapshot.forEach((doc) => {
            console.log(`- ID: ${doc.id} => Data:`, doc.data());
        });

        console.log("すべての接続テストが正常に完了しました");
    } catch (error) {
        console.error("Firebase接続に失敗しました:", error);
    }
}
