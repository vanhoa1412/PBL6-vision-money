import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  Bell, CheckCheck, Trash2, 
  Info, CheckCircle, AlertTriangle, Wallet, 
  Clock, Loader2, ArrowRight
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import axiosClient from "@/lib/axios-client";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

// --- 1. Interface ---
interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: 'BUDGET_WARNING' | 'NEW_INVOICE' | 'PAYMENT_REMINDER' | 'GENERAL'; 
  isRead: boolean;
  relatedId?: number;
  createdAt: string;
}

const Notifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    if (user.id) fetchNotifications();
  }, [user.id]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get("/notifications", { params: { userId: user.id } });
      
      // Sắp xếp: Mới nhất lên đầu (Dựa vào id hoặc createdAt)
      const sorted = res.data.sort((a: Notification, b: Notification) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      setNotifications(sorted);
    } catch (error) {
      console.error("Lỗi tải thông báo:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- 2. Actions ---
  const markAsRead = async (id: number) => {
    // Optimistic Update
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));

    try {
      await axiosClient.put(`/notifications/${id}/read`);
    } catch (e) { console.error(e); }
  };

  const markAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    
    try {
      await axiosClient.put("/notifications/read-all", null, { params: { userId: user.id } });
      toast({ title: "Đã đánh dấu tất cả là đã đọc" });
    } catch (e) { console.error(e); }
  };

  const deleteNotification = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Ngăn click vào card
    if(!confirm("Xóa thông báo này?")) return;
    
    try {
      await axiosClient.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
      toast({ title: "Đã xóa thông báo" });
    } catch (e) { console.error(e); }
  };

  const handleNotificationClick = (item: Notification) => {
    if (!item.isRead) markAsRead(item.id);

    // Logic chuyển trang
    if (item.relatedId) {
        if (item.type === 'NEW_INVOICE') {
            navigate("/invoices");
        } else if (item.type === 'BUDGET_WARNING') {
            navigate("/budgets");
        }
    }
  };

  // --- Helper Icons & UI ---
  const getIcon = (type: string) => {
    switch (type) {
      case 'NEW_INVOICE': 
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'BUDGET_WARNING': 
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'PAYMENT_REMINDER': 
        return <Wallet className="h-5 w-5 text-orange-600" />;
      default: 
        return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: vi });
    } catch (e) { return "Vừa xong"; }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Component con hiển thị danh sách
  const NotificationList = ({ items }: { items: Notification[] }) => {
    if (items.length === 0) {
        // --- Empty State đồng bộ với Budgets/Invoices ---
        return (
            <Card className="border-dashed border-2 shadow-none bg-muted/5">
                <CardContent className="p-10 text-center flex flex-col items-center justify-center">
                    <Bell className="h-12 w-12 text-muted-foreground/40 mb-3" />
                    <h3 className="text-lg font-medium text-muted-foreground">Không có thông báo nào</h3>
                </CardContent>
            </Card>
        );
    }

    return (
      <div className="space-y-3">
        {items.map((item) => (
          <Card 
            key={item.id}
            className={`
                relative group transition-all duration-200 hover:shadow-md cursor-pointer border-l-4 overflow-hidden
                ${item.isRead ? 'border-l-transparent bg-background/50' : 'border-l-primary bg-primary/5'}
            `}
            onClick={() => handleNotificationClick(item)}
          >
            <CardContent className="p-4 flex gap-4 items-start relative z-10">
              <div className={`mt-0.5 p-2 rounded-full ${item.isRead ? 'bg-muted' : 'bg-white shadow-sm'}`}>
                  {getIcon(item.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-2">
                    <h4 className={`text-sm font-semibold truncate ${item.isRead ? 'text-gray-600' : 'text-gray-900'}`}>
                        {item.title}
                    </h4>
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1 whitespace-nowrap shrink-0 mt-0.5">
                        <Clock className="h-3 w-3" /> {formatTime(item.createdAt)}
                    </span>
                </div>
                
                <p className={`text-sm mt-1 line-clamp-2 ${item.isRead ? 'text-muted-foreground' : 'text-gray-800'}`}>
                    {item.message}
                </p>
                
                {item.relatedId && (
                    <div className="mt-2 flex items-center text-xs text-primary font-medium group-hover:underline">
                        Xem chi tiết <ArrowRight className="h-3 w-3 ml-1" />
                    </div>
                )}
              </div>

              {/* Nút xóa - Chỉ hiện khi hover */}
              <Button
                variant="ghost" 
                size="icon" 
                className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 bottom-2 h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={(e) => deleteNotification(item.id, e)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              
              {/* Chấm đỏ chưa đọc */}
              {!item.isRead && (
                <span className="absolute top-4 right-4 h-2 w-2 bg-red-500 rounded-full animate-pulse shadow-sm" />
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
            <h1 className="text-3xl font-bold text-gray-800">Thông báo</h1>
            {unreadCount > 0 && (
                <Badge variant="destructive" className="text-sm px-2.5 py-0.5 rounded-full shadow-sm animate-in zoom-in">
                    {unreadCount} mới
                </Badge>
            )}
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" size="sm" onClick={fetchNotifications} className="flex-1 sm:flex-none">
                Làm mới
            </Button>
            {unreadCount > 0 && (
                <Button variant="outline" size="sm" onClick={markAllRead} className="flex-1 sm:flex-none text-primary hover:text-primary hover:bg-primary/5 border-primary/20">
                    <CheckCheck className="mr-2 h-4 w-4" /> Đọc tất cả
                </Button>
            )}
          </div>
        </div>

        {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary/50"/></div>
        ) : (
            <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="all">Tất cả</TabsTrigger>
                    <TabsTrigger value="unread">Chưa đọc ({unreadCount})</TabsTrigger>
                </TabsList>
                
                <TabsContent value="all" className="animate-in fade-in-50 slide-in-from-bottom-2 duration-500">
                    <NotificationList items={notifications} />
                </TabsContent>
                
                <TabsContent value="unread" className="animate-in fade-in-50 slide-in-from-bottom-2 duration-500">
                    <NotificationList items={notifications.filter(n => !n.isRead)} />
                </TabsContent>
            </Tabs>
        )}
      </div>
    </Layout>
  );
};

export default Notifications;