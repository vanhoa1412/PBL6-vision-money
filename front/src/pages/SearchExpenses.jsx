import React, { useState } from "react";
import axios from "axios";
import Layout from "@/components/Layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

export default function SearchExpense() {
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState([]);
  const [message, setMessage] = useState("");

  const handleSearch = async () => {
    if (!keyword.trim()) {
      setMessage("⚠️ Vui lòng nhập từ khóa tìm kiếm.");
      setResults([]);
      return;
    }

    try {
      const userId = JSON.parse(localStorage.getItem("user"))?.id || 9;
      const res = await axios.get("http://localhost:8080/api/expenses/search", {
      params: { userId, keyword },
      });
      setResults(res.data);
      setMessage("");
    } catch (err) {
      if (err.response?.status === 404) {
        setMessage("❌ Không tìm thấy dữ liệu.");
      } else {
        setMessage("⚠️ Lỗi khi tìm kiếm dữ liệu.");
      }
      setResults([]);
    }
  };

  return (
    <Layout>
      <div className="p-6 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          🔍 Tìm kiếm khoản chi
        </h1>

        <Card className="shadow-md border border-gray-200 rounded-2xl">
          <CardHeader className="pb-0">
            <CardTitle className="text-lg text-gray-700">
              Nhập thông tin tìm kiếm
            </CardTitle>
          </CardHeader>

          <CardContent className="pt-4">
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <Input
                type="text"
                placeholder="Nhập tên cửa hàng, ghi chú, số tiền..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="sm:w-[70%]"
              />
              <Button
                className="flex items-center gap-2 px-5"
                onClick={handleSearch}
              >
                <Search className="w-4 h-4" />
                Tìm kiếm
              </Button>
            </div>

            {message && (
              <p className="text-red-600 mb-4 font-medium">{message}</p>
            )}

            {results.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                  <thead className="bg-gray-100 text-gray-700 text-left">
                    <tr>
                      <th className="px-4 py-3">ID</th>
                      <th className="px-4 py-3">Tên cửa hàng</th>
                      <th className="px-4 py-3">Danh mục</th>
                      <th className="px-4 py-3">Số tiền</th>
                      <th className="px-4 py-3">Ngày</th>
                      <th className="px-4 py-3">Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((item) => (
                      <tr
                        key={item.id}
                        className="border-t hover:bg-gray-50 transition"
                      >
                        <td className="px-4 py-3">{item.id}</td>
                        <td className="px-4 py-3">{item.storeName || "-"}</td>
                        <td className="px-4 py-3">{item.categoryId}</td>
                        <td className="px-4 py-3">
                          {item.totalAmount?.toLocaleString("vi-VN")} ₫
                        </td>
                        <td className="px-4 py-3">{item.expenseDate}</td>
                        <td className="px-4 py-3">{item.note || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
