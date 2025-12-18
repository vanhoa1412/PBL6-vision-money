package com.pocketvision.ledger.controller;

import com.pocketvision.ledger.model.Notification;
import com.pocketvision.ledger.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    // 1. Lấy danh sách thông báo
    @GetMapping
    public ResponseEntity<List<Notification>> getUserNotifications(@RequestParam Long userId) {
        return ResponseEntity.ok(notificationService.getUserNotifications(userId));
    }

    // 2. Đếm số lượng chưa đọc
    @GetMapping("/unread-count")
    public ResponseEntity<Long> countUnread(@RequestParam Long userId) {
        return ResponseEntity.ok(notificationService.countUnread(userId));
    }

    // 3. Đánh dấu 1 thông báo là Đã đọc
    @PutMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable Long id) {
        notificationService.markAsRead(id);
        return ResponseEntity.ok().build();
    }

    // 4. Đánh dấu TẤT CẢ là Đã đọc
    @PutMapping("/read-all")
    public ResponseEntity<?> markAllAsRead(@RequestParam Long userId) {
        notificationService.markAllAsRead(userId);
        return ResponseEntity.ok().build();
    }

    // 5. Xóa thông báo
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteNotification(@PathVariable Long id) {
        notificationService.deleteNotification(id);
        return ResponseEntity.ok().build();
    }
}