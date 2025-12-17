package com.pocketvision.ledger.controller;

import com.pocketvision.ledger.model.User;
import com.pocketvision.ledger.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Objects;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    private void checkOwnership(Long resourceId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String currentEmail = auth.getName(); 
        
        User user = userService.getUserById(resourceId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Nếu email đang đăng nhập khác email của ID cần sửa -> Chặn
        if (!user.getEmail().equals(currentEmail)) {
            throw new RuntimeException("Bạn không có quyền sửa đổi thông tin người dùng này");
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getUserById(@PathVariable Long id) {
        return userService.getUserById(id)
                .map(user -> ResponseEntity.ok(new UserResponse(user))) // Trả về DTO thay vì User full
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(
            @PathVariable Long id, 
            @RequestBody UserService.UpdateUserRequest request) { // Dùng DTO
        try {
            checkOwnership(id); // Bảo mật
            User savedUser = userService.updateUser(id, request);
            return ResponseEntity.ok(new UserResponse(savedUser));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}/password")
    public ResponseEntity<?> changePassword(
            @PathVariable Long id,
            @RequestBody Map<String, String> passwordData) {
        try {
            checkOwnership(id); // Bảo mật
            
            String currentPassword = passwordData.get("currentPassword");
            String newPassword = passwordData.get("newPassword");
            
            if (currentPassword == null || newPassword == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "Thiếu thông tin mật khẩu"));
            }
            
            userService.changePassword(id, currentPassword, newPassword);
            return ResponseEntity.ok(Map.of("message", "Đổi mật khẩu thành công"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    record UserResponse(Long id, String fullName, String email, String role, String avatarUrl) {
        public UserResponse(User user) {
            this(user.getId(), user.getFullName(), user.getEmail(), user.getRole().name(), user.getAvatarUrl());
        }
    }
}