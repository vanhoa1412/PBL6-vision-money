import React, { useState } from "react";
import axios from "axios";
import Layout from "@/components/Layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function FillExpense() {
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    minAmount: "",
    maxAmount: "",
    category: "",
  });
  const [results, setResults] = useState([]);
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleFilter = async () => {
    // FI-05: Kiểm tra min > max
    if (
      filters.minAmount &&
      filters.maxAmount &&
      parseFloat(filters.minAmount) > parseFloat(filters.maxAmount)
    ) {
      setResults([]);
      setMessage("⚠️ Khoảng tiền không hợp lệ (min > max).");
      return;
    }

    try {
      const res = await axios.get("http://localhost:8080/api/expenses/fill", {
        params: {
          userId: 1,
          startDate: filters.startDate || null,
          endDate: filters.endDate || null,
          minAmount: filters.minAmount || null,
          maxAmount: filters.maxAmount || null,
          category: filters.category || null,
        },
      });

      if (res.data.length === 0) {
        // FI-02: Không có dữ liệu trong khoảng thời gian
        setResults([]);
        setMessage("❌ Không có dữ liệu trong khoảng thời gian này.");
      } else {
        // FI-01, FI-03, FI-04, FI-06: Có dữ liệu hợp lệ
        setResults(res.data);
        setMessage(`✅ Tìm thấy ${res.data.length} khoản chi phù hợp.`);
      }
    } catch (err) {
      console.error(err);
      setResults([]);
      setMessage("⚠️ Lỗi khi lọc dữ liệu.");
    }
  };

  return (
    <Layout>
      <div className="p-6 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          📊 Lọc dữ liệu chi tiêu
        </h1>

        <Card className="shadow-md border border-gray-200 rounded-2xl">
          <CardHeader className="pb-0">
            <CardTitle className="text-lg text-gray-700">
              Nhập điều kiện lọc
            </CardTitle>
          </CardHeader>

          <CardContent className="pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {/* FI-01 & FI-02: Lọc theo khoảng ngày */}
              <div>
                <label className="block mb-2 text-gray-600 font-medium">
                  📅 Từ ngày
                </label>
                <Input
                  type="date"
                  name="startDate"
                  value={filters.startDate}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block mb-2 text-gray-600 font-medium">
                  📅 Đến ngày
                </label>
                <Input
                  type="date"
                  name="endDate"
                  value={filters.endDate}
                  onChange={handleChange}
                />
              </div>

              {/* FI-03: Lọc theo danh mục */}
              <div>
                <label className="block mb-2 text-gray-600 font-medium">
                  📂 Danh mục
                </label>
                <Input
                  type="text"
                  name="category"
                  placeholder="VD: Ăn uống, Đi lại..."
                  value={filters.category}
                  onChange={handleChange}
                />
              </div>

              {/* FI-04 & FI-05: Lọc theo khoảng tiền */}
              <div>
                <label className="block mb-2 text-gray-600 font-medium">
                  💰 Từ (₫)
                </label>
                <Input
                  type="number"
                  name="minAmount"
                  placeholder="VD: 100000"
                  value={filters.minAmount}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block mb-2 text-gray-600 font-medium">
                  💰 Đến (₫)
                </label>
                <Input
                  type="number"
                  name="maxAmount"
                  placeholder="VD: 500000"
                  value={filters.maxAmount}
                  onChange={handleChange}
                />
              </div>
            </div>

            {message && (
              <p
                className={`mb-4 font-medium ${
                  message.startsWith("✅")
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {message}
              </p>
            )}

            <Button
              className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 transition rounded-xl"
              onClick={handleFilter}
            >
              🔍 Lọc dữ liệu
            </Button>

            {/* Hiển thị kết quả */}
            {results.length > 0 && (
              <div className="mt-6 overflow-x-auto">
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
                        <td className="px-4 py-3">{item.categoryName}</td>
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
