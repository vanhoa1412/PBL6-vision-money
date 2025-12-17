// package com.pocketvision.ledger.controller;

// import com.pocketvision.ledger.model.Notification;
// import com.pocketvision.ledger.service.NotificationService;
// import org.springframework.beans.factory.annotation.Autowired;
// import org.springframework.http.ResponseEntity;
// import org.springframework.web.bind.annotation.*;

// import java.util.List;
// import java.util.Map;

// @RestController
// @RequestMapping("/api/notifications")
// public class NotificationController {

//     @Autowired
//     private NotificationService notificationService;

//     @GetMapping
//     public ResponseEntity<List<Notification>> getAll(@RequestParam Long userId) {
//         return ResponseEntity.ok(notificationService.getUserNotifications(userId));
//     }

//     @GetMapping("/unread")
//     public ResponseEntity<?> getUnreadCount(@RequestParam Long userId) {
//         return ResponseEntity.ok(Map.of("count", notificationService.countUnread(userId)));
//     }

//     @PutMapping("/{id}/read")
//     public ResponseEntity<?> markRead(@PathVariable Long id) {
//         notificationService.markAsRead(id);
//         return ResponseEntity.ok().build();
//     }

//     @PutMapping("/read-all")
//     public ResponseEntity<?> markAllRead(@RequestParam Long userId) {
//         notificationService.markAllAsRead(userId);
//         return ResponseEntity.ok().build();
//     }

//     @DeleteMapping("/{id}")
//     public ResponseEntity<?> delete(@PathVariable Long id) {
//         notificationService.deleteNotification(id);
//         return ResponseEntity.ok().build();
//     }
// }