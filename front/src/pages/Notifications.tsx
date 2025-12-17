import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  Bell, CheckCheck, Trash2, 
  Info, CheckCircle, AlertTriangle, XCircle, 
  Clock, Loader2 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import axiosClient from "@/lib/axios-client";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale"; // Cần cài: npm install date-fns

interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  isRead: boolean;
  relatedId?: number;
  createdAt: string;
}

const Notifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    if (user.id) fetchNotifications();
  }, [user.id]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get("/notifications", { params: { userId: user.id } });
      setNotifications(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      await axiosClient.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (e) { console.error(e); }
  };

  const markAllRead = async () => {
    try {
      await axiosClient.put("/notifications/read-all", null, { params: { userId: user.id } });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      toast({ title: "Đã đánh dấu tất cả là đã đọc" });
    } catch (e) { console.error(e); }
  };

  const deleteNotification = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Ngăn chặn click vào card
    if(!confirm("Xóa thông báo này?")) return;
    
    try {
      await axiosClient.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
      toast({ title: "Đã xóa thông báo" });
    } catch (e) { console.error(e); }
  };

  // Helper hiển thị icon theo loại
  const getIcon = (type: string) => {
    switch (type) {
      case 'SUCCESS': return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'WARNING': return <AlertTriangle className="h-6 w-6 text-orange-500" />;
      case 'ERROR': return <XCircle className="h-6 w-6 text-red-500" />;
      default: return <Info className="h-6 w-6 text-blue-500" />;
    }
  };

  // Format thời gian (VD: "vừa xong", "5 phút trước")
  const formatTime = (dateStr: string) => {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: vi });
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Component hiển thị list item
  const NotificationList = ({ items }: { items: Notification[] }) => {
    if (items.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p>Không có thông báo nào.</p>
            </div>
        );
    }

    return (
      <div className="space-y-3">
        {items.map((item) => (
          <Card 
            key={item.id}
            className={`
                relative group transition-all hover:shadow-md cursor-pointer border-l-4
                ${item.isRead ? 'border-l-transparent bg-background' : 'border-l-primary bg-primary/5'}
            `}
            onClick={() => !item.isRead && markAsRead(item.id)}
          >
            <CardContent className="p-4 flex gap-4">
              <div className="mt-1">{getIcon(item.type)}</div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                    <h4 className={`text-sm font-semibold ${item.isRead ? 'text-gray-700' : 'text-gray-900'}`}>
                        {item.title}
                    </h4>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {formatTime(item.createdAt)}
                    </span>
                </div>
                <p className={`text-sm mt-1 ${item.isRead ? 'text-muted-foreground' : 'text-gray-800'}`}>
                    {item.message}
                </p>
                
                {/* Nút hành động thêm nếu có relatedId */}
                {item.relatedId && item.type === 'SUCCESS' && (
                    <div className="mt-2">
                        <Button variant="link" className="p-0 h-auto text-primary text-xs" onClick={(e) => {
                            e.stopPropagation();
                            // Logic navigate tới trang chi tiết (ví dụ hóa đơn)
                            window.location.href = `/invoices`; 
                        }}>
                            Xem chi tiết →
                        </Button>
                    </div>
                )}
              </div>

              {/* Nút xóa (chỉ hiện khi hover) */}
              <Button
                variant="ghost" 
                size="icon" 
                className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 bottom-2 h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={(e) => deleteNotification(item.id, e)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              
              {/* Chấm đỏ chưa đọc */}
              {!item.isRead && (
                <div className="absolute top-4 right-4 h-2 w-2 bg-red-500 rounded-full animate-pulse" />
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto p-4 md:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">Thông báo</h1>
            {unreadCount > 0 && (
                <Badge variant="destructive" className="text-sm px-2 rounded-full">
                    {unreadCount} mới
                </Badge>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchNotifications}>
                Làm mới
            </Button>
            {unreadCount > 0 && (
                <Button variant="outline" size="sm" onClick={markAllRead}>
                    <CheckCheck className="mr-2 h-4 w-4" /> Đánh dấu đã đọc hết
                </Button>
            )}
          </div>
        </div>

        {loading ? (
            <div className="text-center py-12"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary"/></div>
        ) : (
            <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="all">Tất cả</TabsTrigger>
                    <TabsTrigger value="unread">Chưa đọc ({unreadCount})</TabsTrigger>
                </TabsList>
                
                <TabsContent value="all" className="animate-in fade-in-50 duration-500">
                    <NotificationList items={notifications} />
                </TabsContent>
                
                <TabsContent value="unread" className="animate-in fade-in-50 duration-500">
                    <NotificationList items={notifications.filter(n => !n.isRead)} />
                </TabsContent>
            </Tabs>
        )}
      </div>
    </Layout>
  );
};

export default Notifications;