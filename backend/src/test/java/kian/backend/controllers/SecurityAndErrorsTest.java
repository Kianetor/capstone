package kian.backend.controllers;

import kian.backend.exceptions.BadRequestException;
import kian.backend.exceptions.NotFoundException;
import kian.backend.security.SecurityConfig;
import kian.backend.services.CardService;
import kian.backend.services.TransactionService;
import kian.backend.services.UserService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// Strato web con la configurazione di sicurezza vera: chi può entrare e che forma hanno gli errori.
// I servizi sono finti (mock): niente database
@WebMvcTest(controllers = {HealthController.class, AuthController.class, CardController.class})
@Import(SecurityConfig.class)
@TestPropertySource(properties = {
        "app.jwt.secret=chiave-di-prova-lunga-almeno-trentadue-byte",
        "app.jwt.expiration-minutes=60",
        "app.cors.allowed-origins=http://localhost:5173"})
class SecurityAndErrorsTest {

    private static final UUID USER = UUID.randomUUID();

    @Autowired
    private MockMvc mvc;

    @MockitoBean
    private UserService userService;

    @MockitoBean
    private CardService cardService;

    @MockitoBean
    private TransactionService transactionService;

    @Test
    @DisplayName("Lo stato del server è pubblico")
    void healthIsPublic() throws Exception {
        mvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ok"));
    }

    @Test
    @DisplayName("Senza token l'inventario risponde 401")
    void inventoryNeedsToken() throws Exception {
        mvc.perform(get("/api/cards")).andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Con un token valido l'inventario risponde 200")
    void inventoryWithToken() throws Exception {
        mvc.perform(get("/api/cards/groups").with(jwt().jwt(j -> j.subject(USER.toString()))))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Registrazione con dati non validi: 400 con l'errore di ogni campo")
    void invalidRegistration() throws Exception {
        mvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"a\",\"email\":\"non-una-email\",\"password\":\"corta\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.username").exists())
                .andExpect(jsonPath("$.errors.email").exists())
                .andExpect(jsonPath("$.errors.password").exists());
    }

    @Test
    @DisplayName("Carta inesistente o di un altro utente: 404 con un messaggio")
    void cardNotFound() throws Exception {
        UUID id = UUID.randomUUID();
        when(cardService.detail(USER, id)).thenThrow(new NotFoundException("Carta non trovata"));

        mvc.perform(get("/api/cards/" + id).with(jwt().jwt(j -> j.subject(USER.toString()))))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Carta non trovata"));
    }

    @Test
    @DisplayName("Vendere più copie di quelle possedute: 400 con il motivo")
    void sellingTooManyCopies() throws Exception {
        UUID id = UUID.randomUUID();
        when(transactionService.create(eq(USER), eq(id), any()))
                .thenThrow(new BadRequestException("Copie insufficienti: ne possiedi 1"));

        mvc.perform(post("/api/cards/" + id + "/transactions")
                        .with(jwt().jwt(j -> j.subject(USER.toString())))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"type\":\"SELL\",\"quantity\":2,\"unitPrice\":10,\"date\":\"2026-10-01\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Copie insufficienti: ne possiedi 1"));
    }
}
