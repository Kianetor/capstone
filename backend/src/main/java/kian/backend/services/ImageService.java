package kian.backend.services;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import kian.backend.exceptions.BadRequestException;
import kian.backend.exceptions.ExternalServiceException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.Set;

// Upload delle foto su Cloudinary: nel database salviamo solo l'indirizzo https dell'immagine
@Slf4j
@Service
public class ImageService {

    private static final long MAX_SIZE = 5 * 1024 * 1024;
    private static final Set<String> ALLOWED_TYPES = Set.of("image/jpeg", "image/png", "image/webp");
    private static final String FOLDER = "cardvault";

    // null se le chiavi non sono configurate: il resto dell'app funziona lo stesso
    private final Cloudinary cloudinary;

    public ImageService(@Value("${app.cloudinary.cloud-name}") String cloudName,
                        @Value("${app.cloudinary.api-key}") String apiKey,
                        @Value("${app.cloudinary.api-secret}") String apiSecret) {
        if (cloudName.isBlank() || apiKey.isBlank() || apiSecret.isBlank()) {
            log.warn("Cloudinary non configurato: l'upload delle foto non è disponibile");
            this.cloudinary = null;
        } else {
            this.cloudinary = new Cloudinary(ObjectUtils.asMap(
                    "cloud_name", cloudName,
                    "api_key", apiKey,
                    "api_secret", apiSecret,
                    "secure", true));
        }
    }

    public String upload(MultipartFile file) {
        byte[] bytes = validate(file);
        if (cloudinary == null) {
            throw new ExternalServiceException("Upload foto non configurato sul server", null);
        }
        try {
            Map<?, ?> result = cloudinary.uploader().upload(bytes, ObjectUtils.asMap(
                    "folder", FOLDER,
                    "resource_type", "image"));
            return (String) result.get("secure_url");
        } catch (IOException | RuntimeException e) {
            throw new ExternalServiceException("Upload foto non riuscito, riprova più tardi", e);
        }
    }

    private static byte[] validate(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Nessun file ricevuto");
        }
        if (file.getSize() > MAX_SIZE) {
            throw new BadRequestException("Il file supera i 5 MB");
        }
        if (file.getContentType() == null || !ALLOWED_TYPES.contains(file.getContentType())) {
            throw new BadRequestException("Formati ammessi: JPEG, PNG, WEBP");
        }
        try {
            byte[] bytes = file.getBytes();
            // Il tipo dichiarato dal browser si può falsificare: controlliamo anche i primi byte del file
            if (!isImage(bytes)) {
                throw new BadRequestException("Il file non è un'immagine valida");
            }
            return bytes;
        } catch (IOException e) {
            throw new BadRequestException("File non leggibile");
        }
    }

    private static boolean isImage(byte[] b) {
        boolean jpeg = b.length > 3 && (b[0] & 0xFF) == 0xFF && (b[1] & 0xFF) == 0xD8 && (b[2] & 0xFF) == 0xFF;
        boolean png = b.length > 8 && (b[0] & 0xFF) == 0x89 && b[1] == 'P' && b[2] == 'N' && b[3] == 'G';
        boolean webp = b.length > 12 && b[0] == 'R' && b[1] == 'I' && b[2] == 'F' && b[3] == 'F'
                && b[8] == 'W' && b[9] == 'E' && b[10] == 'B' && b[11] == 'P';
        return jpeg || png || webp;
    }
}
