package kian.backend.payloads;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

// Pokémon scelto come avatar (numero di Pokédex); null toglie l'avatar
public record AvatarRequest(
        @Min(1) @Max(1025) Integer avatarDex
) {
}
