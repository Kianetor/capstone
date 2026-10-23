package kian.backend.controllers;

import jakarta.validation.Valid;
import kian.backend.payloads.AvatarRequest;
import kian.backend.payloads.UserResponse;
import kian.backend.services.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

// L'utente è sempre quello del JWT: nessun id utente arriva dal client
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public UserResponse me(@AuthenticationPrincipal Jwt jwt) {
        return userService.me(UUID.fromString(jwt.getSubject()));
    }

    @PatchMapping("/me/avatar")
    public UserResponse updateAvatar(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody AvatarRequest request) {
        return userService.updateAvatar(UUID.fromString(jwt.getSubject()), request);
    }
}
