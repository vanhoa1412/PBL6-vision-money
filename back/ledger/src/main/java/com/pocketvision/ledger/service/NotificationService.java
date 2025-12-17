// package com.pocketvision.ledger.service;

// import com.pocketvision.ledger.model.Notification;
// import com.pocketvision.ledger.repository.NotificationRepository;
// import org.springframework.beans.factory.annotation.Autowired;
// import org.springframework.stereotype.Service;

// import java.util.List;

// @Service
// public class NotificationService {

//     @Autowired
//     private NotificationRepository notificationRepository;

//     public List<Notification> getUserNotifications(Long userId) {
//         return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
//     }

//     public long countUnread(Long userId) {
//         return notificationRepository.countByUserIdAndIsReadFalse(userId);
//     }

//     public void markAsRead(Long id) {
//         notificationRepository.findById(id).ifPresent(n -> {
//             n.setRead(true);
//             notificationRepository.save(n);
//         });
//     }

//     public void markAllAsRead(Long userId) {
//         List<Notification> list = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
//         list.forEach(n -> n.setRead(true));
//         notificationRepository.saveAll(list);
//     }

//     public void deleteNotification(Long id) {
//         notificationRepository.deleteById(id);
//     }

//     public void createNotification(Long userId, String title, String message, Notification.NotificationType type, Long relatedId) {
//         Notification n = new Notification();
//         n.setUserId(userId);
//         n.setTitle(title);
//         n.setMessage(message);
//         n.setType(type);
//         n.setRelatedId(relatedId);
//         notificationRepository.save(n);
//     }
// }