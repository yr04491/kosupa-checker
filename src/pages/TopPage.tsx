import { useEffect } from "react";
import { testFirestoreConnection } from "../lib/accessTest";

export default function TopPage() {
  useEffect(() => {
    testFirestoreConnection();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <h1 className="text-2xl font-bold text-gray-800">トップページ（入力フォーム）</h1>
    </div>
  );
}
