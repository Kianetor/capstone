package kian.backend.controllers;

import jakarta.validation.Valid;
import kian.backend.payloads.LoginRequest;
import kian.backend.payloads.LoginResponse;
import kian.backend.payloads.RegisterRequest;
import kian.backend.payloads.UserResponse;
import kian.backend.services.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse register(@Valid @RequestBody RegisterRequest request) {
        return userService.register(request);
    }

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request) {
        return userService.login(request);
    }
}
