package kian.backend.controllers;

import kian.backend.payloads.ExternalCardDetail;
import kian.backend.payloads.ExternalSearchResponse;
import kian.backend.services.ExternalCardService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

// Tramite verso l'API esterna di carte Pokémon (solo utenti autenticati)
@RestController
@RequestMapping("/api/external/cards")
@RequiredArgsConstructor
public class ExternalCardController {

    private final ExternalCardService externalCardService;

    // Esempi: ?q=charizard&lang=it&page=2, ?q=4/102, ?q=charizard 4/102, ?q=base1-4
    @GetMapping("/search")
    public ExternalSearchResponse search(@RequestParam(required = false) String q,
                                         @RequestParam(required = false) String lang,
                                         @RequestParam(required = false) Integer page) {
        return externalCardService.search(q, lang, page);
    }

    // Esempio: /api/external/cards/base1-4?lang=en
    @GetMapping("/{externalId}")
    public ExternalCardDetail detail(@PathVariable String externalId,
                                     @RequestParam(required = false) String lang) {
        return externalCardService.detail(externalId, lang);
    }
}
