package kian.backend.controllers;

import kian.backend.payloads.ExternalCardDetail;
import kian.backend.payloads.ExternalSearchResponse;
import kian.backend.payloads.ExternalSeriesDetail;
import kian.backend.payloads.ExternalSeriesSummary;
import kian.backend.payloads.ExternalSetDetail;
import kian.backend.payloads.ExternalSetSummary;
import kian.backend.services.ExternalCardService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// Tramite verso l'API esterna di carte Pokémon: pubblico, lo usano anche i visitatori non registrati
@RestController
@RequestMapping("/api/external")
@RequiredArgsConstructor
public class ExternalCardController {

    private final ExternalCardService externalCardService;

    // Esempi: ?q=charizard&lang=it&page=2, ?q=4/102, ?q=charizard 4/102, ?q=base1-4
    @GetMapping("/cards/search")
    public ExternalSearchResponse search(@RequestParam(required = false) String q,
                                         @RequestParam(required = false) String lang,
                                         @RequestParam(required = false) Integer page) {
        return externalCardService.search(q, lang, page);
    }

    // Esempio: /api/external/cards/base1-4?lang=en
    @GetMapping("/cards/{externalId}")
    public ExternalCardDetail detail(@PathVariable String externalId,
                                     @RequestParam(required = false) String lang) {
        return externalCardService.detail(externalId, lang);
    }

    // Esempio: /api/external/series?lang=it
    @GetMapping("/series")
    public List<ExternalSeriesSummary> series(@RequestParam(required = false) String lang) {
        return externalCardService.series(lang);
    }

    // Esempio: /api/external/series/sv?lang=it
    @GetMapping("/series/{seriesId}")
    public ExternalSeriesDetail seriesDetail(@PathVariable String seriesId, @RequestParam(required = false) String lang) {
        return externalCardService.seriesDetail(seriesId, lang);
    }

    // Esempio: /api/external/sets/latest?lang=it&limit=12
    @GetMapping("/sets/latest")
    public List<ExternalSetSummary> latestSets(@RequestParam(required = false) String lang,
                                               @RequestParam(required = false) Integer limit) {
        return externalCardService.latestSets(lang, limit);
    }

    // Esempio: /api/external/sets/sv03.5?lang=it
    @GetMapping("/sets/{setId}")
    public ExternalSetDetail setDetail(@PathVariable String setId, @RequestParam(required = false) String lang) {
        return externalCardService.setDetail(setId, lang);
    }
}
