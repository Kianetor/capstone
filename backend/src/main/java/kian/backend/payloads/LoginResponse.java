package kian.backend.payloads;

import java.time.Instant;

public record LoginResponse(
        String token,
        String tokenType,
        Instant expiresAt
) {
    @Override
    public String toString() {
        return "LoginResponse[token=***, tokenType=" + tokenType + ", expiresAt=" + expiresAt + "]";
    }
}
