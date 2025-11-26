import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, TrendingDown, AlertTriangle, Lightbulb, Bell, CheckCircle, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import { Link } from "react-router-dom";

interface Notification {
  id: number;
  userId: number;
  type: string;
  title: string;
  message: string;
  relatedId?: number;
  isRead: boolean;
  createdAt: string;
  priority: string;
  actionUrl?: string;
}

const Notifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const userId = Number(localStorage.getItem("userId"));

  useEffect(() => {
    if (userId) {
      fetchNotifications();
    }
  }, [userId]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `http://localhost:8080/api/notifications?userId=${userId}`
      );
      setNotifications(response.data);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải thông báo",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      await axios.post(
        `http://localhost:8080/api/notifications/${notificationId}/mark-read?userId=${userId}`
      );
      
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, isRead: true } : notif
        )
      );
      
      toast({
        title: "Thành công",
        description: "Đã đánh dấu là đã đọc",
      });
    } catch (error) {
      console.error("Error marking as read:", error);
      toast({
        title: "Lỗi",
        description: "Không thể đánh dấu là đã đọc",
        variant: "destructive",
      });
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.post(
        `http://localhost:8080/api/notifications/mark-all-read?userId=${userId}`
      );
      
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, isRead: true }))
      );
      
      toast({
        title: "Thành công",
        description: "Đã đánh dấu tất cả là đã đọc",
      });
    } catch (error) {
      console.error("Error marking all as read:", error);
      toast({
        title: "Lỗi",
        description: "Không thể đánh dấu tất cả là đã đọc",
        variant: "destructive",
      });
    }
  };

  const deleteNotification = async (notificationId: number) => {
    try {
      await axios.delete(
        `http://localhost:8080/api/notifications/${notificationId}?userId=${userId}`
      );
      
      setNotifications(prev => 
        prev.filter(notif => notif.id !== notificationId)
      );
      
      toast({
        title: "Thành công",
        description: "Đã xóa thông báo",
      });
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast({
        title: "Lỗi",
        description: "Không thể xóa thông báo",
        variant: "destructive",
      });
    }
  };

  const deleteAllRead = async () => {
    try {
      const response = await axios.delete(
        `http://localhost:8080/api/notifications/clean-read?userId=${userId}`
      );
      
      setNotifications(prev => 
        prev.filter(notif => !notif.isRead)
      );
      
      const deletedCount = response.data.deletedCount;
      toast({
        title: "Thành công",
        description: `Đã xóa ${deletedCount} thông báo đã đọc`,
      });
    } catch (error) {
      console.error("Error deleting read notifications:", error);
      toast({
        title: "Lỗi",
        description: "Không thể xóa thông báo đã đọc",
        variant: "destructive",
      });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "BUDGET_WARNING":
        return AlertTriangle;
      case "SPENDING_ALERT":
        return TrendingDown;
      case "SAVING_TIP":
        return Lightbulb;
      case "ACHIEVEMENT":
      case "FINANCIAL_INSIGHT":
        return Sparkles;
      default:
        return Bell;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "BUDGET_WARNING":
        return "text-destructive";
      case "SPENDING_ALERT":
        return "text-orange-500";
      case "SAVING_TIP":
        return "text-green-500";
      case "ACHIEVEMENT":
      case "FINANCIAL_INSIGHT":
        return "text-blue-500";
      default:
        return "text-muted-foreground";
    }
  };

  const getNotificationBadge = (type: string) => {
    switch (type) {
      case "BUDGET_WARNING":
        return { label: "Cảnh báo", variant: "destructive" as const };
      case "SPENDING_ALERT":
        return { label: "Chi tiêu", variant: "secondary" as const };
      case "SAVING_TIP":
        return { label: "Tiết kiệm", variant: "outline" as const };
      case "ACHIEVEMENT":
        return { label: "Thành tích", variant: "default" as const };
      case "FINANCIAL_INSIGHT":
        return { label: "Thông tin", variant: "default" as const };
      default:
        return { label: "Thông báo", variant: "outline" as const };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) {
      return `${diffMins} phút trước`;
    } else if (diffHours < 24) {
      return `${diffHours} giờ trước`;
    } else if (diffDays < 7) {
      return `${diffDays} ngày trước`;
    } else {
      return date.toLocaleDateString('vi-VN');
    }
  };

  const unreadCount = notifications.filter(notif => !notif.isRead).length;
  const hasReadNotifications = notifications.some(notif => notif.isRead);

  if (loading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="mb-4">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center">
                <Bell className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Thông báo</h1>
                <p className="text-muted-foreground">
                  Quản lý và xem tất cả thông báo của bạn
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <Button onClick={markAllAsRead} variant="outline" className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Đánh dấu tất cả đã đọc
                </Button>
              )}
              
              {/* Nút xóa tất cả đã đọc */}
              {hasReadNotifications && (
                <Button onClick={deleteAllRead} variant="outline" className="flex items-center gap-2">
                  <Trash2 className="h-4 w-4" />
                  Xóa đã đọc
                </Button>
              )}
            </div>
          </div>

          {unreadCount > 0 && (
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Badge variant="destructive" className="animate-pulse">
                  {unreadCount} chưa đọc
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Bạn có {unreadCount} thông báo chưa đọc
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {notifications.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Không có thông báo</h3>
                <p className="text-muted-foreground">
                  Bạn chưa có thông báo nào. Thông báo mới sẽ xuất hiện ở đây.
                </p>
              </CardContent>
            </Card>
          ) : (
            notifications.map((notification) => {
              const Icon = getNotificationIcon(notification.type);
              const badgeInfo = getNotificationBadge(notification.type);
              
              return (
                <Card 
                  key={notification.id} 
                  className={`hover:shadow-elegant transition-all border-l-4 ${
                    notification.isRead 
                      ? 'border-l-muted-foreground opacity-75' 
                      : 'border-l-primary bg-primary/5'
                  }`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`p-2 rounded-lg bg-accent ${getNotificationColor(notification.type)}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <CardTitle className={`text-lg ${notification.isRead ? 'text-muted-foreground' : ''}`}>
                              {notification.title}
                            </CardTitle>
                            <Badge variant={badgeInfo.variant}>
                              {badgeInfo.label}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(notification.createdAt)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex gap-1">
                        {!notification.isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(notification.id)}
                            className="flex items-center gap-1"
                            title="Đánh dấu đã đọc"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {/* Nút xóa thông báo */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteNotification(notification.id)}
                          className="flex items-center gap-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                          title="Xóa thông báo"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-3">{notification.message}</p>
                    {notification.actionUrl && (
                      <Button variant="link" className="p-0 h-auto" asChild>
                        <Link to={notification.actionUrl}>
                          Xem chi tiết →
                        </Link>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Info Card */}
        <Card className="mt-6 bg-gradient-to-br from-primary/5 to-accent">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Sparkles className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-2">Thông báo thông minh</h3>
                <p className="text-sm text-muted-foreground">
                  Hệ thống sẽ tự động gửi thông báo khi phát hiện xu hướng chi tiêu bất thường, 
                  cảnh báo vượt ngân sách, hoặc đưa ra gợi ý tiết kiệm thông minh dựa trên thói quen chi tiêu của bạn.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Notifications;