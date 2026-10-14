package kian.backend.services;

import kian.backend.entities.Role;
import kian.backend.entities.User;
import kian.backend.exceptions.BadRequestException;
import kian.backend.exceptions.NotFoundException;
import kian.backend.exceptions.UnauthorizedException;
import kian.backend.payloads.LoginRequest;
import kian.backend.payloads.LoginResponse;
import kian.backend.payloads.RegisterRequest;
import kian.backend.payloads.UserResponse;
import kian.backend.repositories.UserRepository;
import kian.backend.security.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;
import java.util.UUID;

// Nei log solo l'id dell'utente e l'esito: niente email, password o token
@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Transactional
    public UserResponse register(RegisterRequest request) {
        String email = normalizeEmail(request.email());
        String username = request.username().trim();
        if (userRepository.existsByEmail(email)) {
            throw new BadRequestException("Email già registrata");
        }
        if (userRepository.existsByUsernameIgnoreCase(username)) {
            throw new BadRequestException("Username già in uso");
        }

        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setRole(Role.USER);
        userRepository.save(user);

        log.info("Registrato utente={}", user.getId());
        return UserResponse.of(user);
    }

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        // Stesso errore per email inesistente e password errata: non riveliamo quali email sono registrate
        User user = userRepository.findByEmail(normalizeEmail(request.email()))
                .filter(u -> passwordEncoder.matches(request.password(), u.getPassword()))
                .orElseThrow(() -> new UnauthorizedException("Credenziali non valide"));
        log.info("Login riuscito utente={}", user.getId());
        return jwtService.generate(user);
    }

    @Transactional(readOnly = true)
    public UserResponse me(UUID userId) {
        return UserResponse.of(findById(userId));
    }

    // Usato dagli altri service per collegare carte e transazioni al proprietario
    public User findById(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("Utente non trovato"));
    }

    private static String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
