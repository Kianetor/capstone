package kian.backend.controllers;

import kian.backend.payloads.PokemonResponse;
import kian.backend.services.JapaneseNames;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

// Elenco dei Pokémon (numero di Pokédex e nome) tra cui scegliere l'avatar
@RestController
@RequestMapping("/api/pokemon")
@RequiredArgsConstructor
public class PokemonController {

    private final JapaneseNames japaneseNames;

    @GetMapping
    public List<PokemonResponse> list() {
        return japaneseNames.pokemon();
    }
}
