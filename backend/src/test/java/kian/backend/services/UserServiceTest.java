package kian.backend.services;

import kian.backend.entities.Role;
import kian.backend.entities.User;
import kian.backend.exceptions.BadRequestException;
import kian.backend.exceptions.UnauthorizedException;
import kian.backend.payloads.AvatarRequest;
import kian.backend.payloads.LoginRequest;
import kian.backend.payloads.RegisterRequest;
import kian.backend.payloads.UserResponse;
import kian.backend.repositories.UserRepository;
import kian.backend.security.JwtService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

// Registrazione, login e avatar
@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @InjectMocks
    private UserService userService;

    @Test
    @DisplayName("La registrazione salva l'email in minuscolo e la password cifrata, con ruolo USER")
    void registerNormalizesEmailAndHashesPassword() {
        when(passwordEncoder.encode("password123")).thenReturn("hash");

        userService.register(new RegisterRequest(" ash ", " Ash@Example.COM ", "password123"));

        ArgumentCaptor<User> saved = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(saved.capture());
        assertThat(saved.getValue().getEmail()).isEqualTo("ash@example.com");
        assertThat(saved.getValue().getUsername()).isEqualTo("ash");
        assertThat(saved.getValue().getPassword()).isEqualTo("hash");
        assertThat(saved.getValue().getRole()).isEqualTo(Role.USER);
    }

    @Test
    @DisplayName("Non ci si può registrare due volte con la stessa email")
    void duplicateEmailIsRejected() {
        when(userRepository.existsByEmail("ash@example.com")).thenReturn(true);

        assertThatThrownBy(() -> userService.register(new RegisterRequest("ash", "ash@example.com", "password123")))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Email già registrata");
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Password sbagliata ed email inesistente danno lo stesso errore")
    void wrongCredentialsGiveSameError() {
        User user = user();
        when(userRepository.findByEmail("ash@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("sbagliata", "hash")).thenReturn(false);
        when(userRepository.findByEmail("nessuno@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.login(new LoginRequest("ash@example.com", "sbagliata")))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessage("Credenziali non valide");
        assertThatThrownBy(() -> userService.login(new LoginRequest("nessuno@example.com", "password123")))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessage("Credenziali non valide");
        verify(jwtService, never()).generate(any());
    }

    @Test
    @DisplayName("Cambiare avatar aggiorna l'utente; null torna all'iniziale")
    void updateAvatar() {
        User user = user();
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));

        UserResponse pikachu = userService.updateAvatar(user.getId(), new AvatarRequest(25));
        assertThat(pikachu.avatarDex()).isEqualTo(25);

        UserResponse none = userService.updateAvatar(user.getId(), new AvatarRequest(null));
        assertThat(none.avatarDex()).isNull();
    }

    private static User user() {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setUsername("ash");
        user.setEmail("ash@example.com");
        user.setPassword("hash");
        user.setRole(Role.USER);
        return user;
    }
}
