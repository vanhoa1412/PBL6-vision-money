import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, TrendingDown, AlertTriangle, Lightbulb } from "lucide-react";

const AISuggestions = () => {
  const suggestions = [
    {
      type: "warning",
      icon: AlertTriangle,
      title: "Chi tiêu ăn uống tăng cao",
      description: "Bạn đã chi 3.2 triệu cho ăn uống trong tháng này, tăng 45% so với tháng trước.",
      action: "Cân nhắc nấu ăn tại nhà nhiều hơn để tiết kiệm.",
      severity: "high",
    },
    {
      type: "tip",
      icon: Lightbulb,
      title: "Thời điểm tốt để mua sắm",
      description: "Các siêu thị thường có khuyến mãi vào cuối tuần. Bạn có thể tiết kiệm 15-20%.",
      action: "Lên kế hoạch mua sắm vào thứ 7 hàng tuần.",
      severity: "low",
    },
    {
      type: "saving",
      icon: TrendingDown,
      title: "Cơ hội tiết kiệm chi phí di chuyển",
      description: "Bạn đã chi 1.5 triệu cho Grab/taxi. Cân nhắc dùng xe buýt hoặc đi chung xe.",
      action: "Có thể tiết kiệm khoảng 800k/tháng.",
      severity: "medium",
    },
    {
      type: "insight",
      icon: Sparkles,
      title: "Xu hướng chi tiêu tích cực",
      description: "Bạn đã giảm 20% chi tiêu cho giải trí so với 3 tháng trước. Tiếp tục duy trì!",
      action: "Sử dụng số tiền tiết kiệm được cho quỹ dự phòng.",
      severity: "low",
    },
  ];

  const getBadgeVariant = (severity: string) => {
    switch (severity) {
      case "high":
        return "destructive";
      case "medium":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case "warning":
        return "text-destructive";
      case "saving":
        return "text-primary";
      case "tip":
        return "text-secondary";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold">Gợi ý thông minh từ AI</h1>
          </div>
          <p className="text-muted-foreground">
            Phân tích chi tiêu và đưa ra các gợi ý để bạn quản lý tài chính tốt hơn
          </p>
        </div>

        {/* AI Insights */}
        <div className="space-y-4">
          {suggestions.map((suggestion, index) => {
            const Icon = suggestion.icon;
            return (
              <Card key={index} className="hover:shadow-elegant transition-all border-l-4 border-l-primary">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`p-2 rounded-lg bg-accent ${getIconColor(suggestion.type)}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle className="text-lg">{suggestion.title}</CardTitle>
                          <Badge variant={getBadgeVariant(suggestion.severity) as any}>
                            {suggestion.severity === "high" && "Quan trọng"}
                            {suggestion.severity === "medium" && "Chú ý"}
                            {suggestion.severity === "low" && "Gợi ý"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-3">
                    {suggestion.description}
                  </p>
                  <div className="bg-accent/50 p-3 rounded-lg">
                    <p className="text-sm font-medium flex items-start gap-2">
                      <span className="text-primary">💡</span>
                      {suggestion.action}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Info Card */}
        <Card className="mt-6 bg-gradient-to-br from-primary/5 to-accent">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Sparkles className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-2">Cách AI phân tích chi tiêu của bạn</h3>
                <p className="text-sm text-muted-foreground">
                  Hệ thống AI của chúng tôi phân tích lịch sử chi tiêu, so sánh xu hướng qua các tháng,
                  và đưa ra các gợi ý cá nhân hóa dựa trên thói quen chi tiêu của bạn. Càng sử dụng nhiều,
                  các gợi ý càng chính xác và hữu ích hơn.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default AISuggestions;
