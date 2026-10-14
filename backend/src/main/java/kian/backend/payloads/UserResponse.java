package kian.backend.payloads;

import kian.backend.entities.Role;
import kian.backend.entities.User;

import java.time.LocalDateTime;
import java.util.UUID;

// Mai la password nelle risposte
public record UserResponse(
        UUID id,
        String username,
        String email,
        Role role,
        LocalDateTime createdAt
) {
    public static UserResponse of(User user) {
        return new UserResponse(user.getId(), user.getUsername(), user.getEmail(), user.getRole(), user.getCreatedAt());
    }
}
