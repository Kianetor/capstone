package kian.backend.controllers;

import kian.backend.payloads.ExternalCardDetail;
import kian.backend.payloads.ExternalCardSummary;
import kian.backend.services.ExternalCardService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// Tramite verso l'API esterna di carte Pokémon (solo utenti autenticati)
@RestController
@RequestMapping("/api/external/cards")
@RequiredArgsConstructor
public class ExternalCardController {

    private final ExternalCardService externalCardService;

    // Esempio: /api/external/cards/search?q=charizard&lang=it
    @GetMapping("/search")
    public List<ExternalCardSummary> search(@RequestParam(required = false) String q,
                                            @RequestParam(required = false) String lang) {
        return externalCardService.search(q, lang);
    }

    // Esempio: /api/external/cards/base1-4?lang=en
    @GetMapping("/{externalId}")
    public ExternalCardDetail detail(@PathVariable String externalId,
                                     @RequestParam(required = false) String lang) {
        return externalCardService.detail(externalId, lang);
    }
}
