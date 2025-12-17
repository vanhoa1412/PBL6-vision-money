package com.pocketvision.ledger.service;

import com.pocketvision.ledger.model.User;
import com.pocketvision.ledger.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public Optional<User> getUserById(Long id) {
        return userRepository.findById(id);
    }

    public record UpdateUserRequest(String fullName, String avatarUrl) {}

    public User updateUser(Long id, UpdateUserRequest request) {
        return userRepository.findById(id)
                .map(user -> {
                    if (request.fullName() != null) user.setFullName(request.fullName());
                    if (request.avatarUrl() != null) user.setAvatarUrl(request.avatarUrl());
                    
                    user.setUpdatedAt(LocalDateTime.now());
                    return userRepository.save(user);
                })
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
    }

    public void changePassword(Long id, String currentPassword, String newPassword) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
        
        if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            throw new RuntimeException("Mật khẩu hiện tại không đúng");
        }
        
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
    }

    public void updateUserSettings(Long id, Map<String, Object> settings) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
        
        
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
    }
}