package kian.backend.payloads;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

// Nessun campo ruolo: un "role" aggiunto al corpo della richiesta viene semplicemente ignorato
public record RegisterRequest(
        @NotBlank
        @Size(min = 3, max = 30)
        @Pattern(regexp = "^[A-Za-z0-9_.-]+$", message = "solo lettere, numeri, punto, trattino e underscore")
        String username,
        @NotBlank @Email @Size(max = 254) String email,
        @NotBlank @Size(min = 8, max = 72) String password
) {
    @Override
    public String toString() {
        return "RegisterRequest[username=" + username + ", email=***, password=***]";
    }
}
