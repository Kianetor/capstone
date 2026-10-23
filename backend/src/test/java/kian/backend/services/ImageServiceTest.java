package kian.backend.services;

import kian.backend.exceptions.BadRequestException;
import kian.backend.exceptions.ExternalServiceException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

// Controlli sul file prima di mandarlo a Cloudinary (qui senza chiavi: niente upload veri)
class ImageServiceTest {

    private static final byte[] PNG = {(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A, 0, 0};

    private final ImageService imageService = new ImageService("", "", "");

    @Test
    @DisplayName("Un file che dichiara di essere un'immagine ma non lo è viene rifiutato")
    void fakeImageIsRejected() {
        MockMultipartFile file = new MockMultipartFile("file", "foto.png", "image/png", "non sono un png".getBytes());

        assertThatThrownBy(() -> imageService.upload(file))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Il file non è un'immagine valida");
    }

    @Test
    @DisplayName("Sono ammessi solo JPEG, PNG e WEBP")
    void otherTypesAreRejected() {
        MockMultipartFile file = new MockMultipartFile("file", "foto.gif", "image/gif", PNG);

        assertThatThrownBy(() -> imageService.upload(file)).isInstanceOf(BadRequestException.class);
    }

    @Test
    @DisplayName("I file oltre 5 MB vengono rifiutati")
    void tooLargeIsRejected() {
        MockMultipartFile file = new MockMultipartFile("file", "foto.png", "image/png", new byte[5 * 1024 * 1024 + 1]);

        assertThatThrownBy(() -> imageService.upload(file))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Il file supera i 5 MB");
    }

    @Test
    @DisplayName("Immagine valida ma Cloudinary non configurato: 503 con un messaggio chiaro")
    void missingConfiguration() {
        MockMultipartFile file = new MockMultipartFile("file", "foto.png", "image/png", PNG);

        assertThatThrownBy(() -> imageService.upload(file)).isInstanceOf(ExternalServiceException.class);
    }
}
