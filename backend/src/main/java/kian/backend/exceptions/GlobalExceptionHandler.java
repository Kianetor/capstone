package kian.backend.exceptions;

import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.MultipartException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.util.LinkedHashMap;
import java.util.Map;

// Risposte di errore in un formato unico: { "status": ..., "message": ... } oppure { "status": 400, "errors": {...} }
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, Object> validation(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new LinkedHashMap<>();
        ex.getBindingResult().getFieldErrors()
                .forEach(e -> errors.putIfAbsent(e.getField(), e.getDefaultMessage()));
        return Map.of("status", 400, "errors", errors);
    }

    @ExceptionHandler(BadRequestException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, Object> badRequest(BadRequestException ex) {
        return Map.of("status", 400, "message", ex.getMessage());
    }

    // JSON malformato o tipo sbagliato: non restituiamo il dettaglio del parser
    @ExceptionHandler({HttpMessageNotReadableException.class, MethodArgumentTypeMismatchException.class})
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, Object> invalidRequest(Exception ex) {
        return Map.of("status", 400, "message", "Richiesta non valida");
    }

    // Upload oltre il limite di spring.servlet.multipart.max-file-size
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    @ResponseStatus(HttpStatus.PAYLOAD_TOO_LARGE)
    public Map<String, Object> fileTooLarge(MaxUploadSizeExceededException ex) {
        return Map.of("status", 413, "message", "Il file supera i 5 MB");
    }

    // Richiesta di upload senza il campo "file" o non multipart
    @ExceptionHandler({MissingServletRequestPartException.class, MissingServletRequestParameterException.class,
            MultipartException.class})
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, Object> missingFile(Exception ex) {
        return Map.of("status", 400, "message", "Nessun file ricevuto");
    }

    @ExceptionHandler(UnauthorizedException.class)
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    public Map<String, Object> unauthorized(UnauthorizedException ex) {
        return Map.of("status", 401, "message", ex.getMessage());
    }

    @ExceptionHandler(NotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public Map<String, Object> notFound(NotFoundException ex) {
        return Map.of("status", 404, "message", ex.getMessage());
    }

    @ExceptionHandler(NoResourceFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public Map<String, Object> noResource(NoResourceFoundException ex) {
        return Map.of("status", 404, "message", "Risorsa non trovata");
    }

    // Due modifiche contemporanee della stessa carta: la seconda deve ricaricare i dati
    @ExceptionHandler(ObjectOptimisticLockingFailureException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public Map<String, Object> optimisticLock(ObjectOptimisticLockingFailureException ex) {
        return Map.of("status", 409, "message", "Dati modificati da un'altra richiesta, ricarica e riprova");
    }

    // Vincolo del database violato (es. due registrazioni identiche contemporanee): niente dettagli SQL al client
    @ExceptionHandler(DataIntegrityViolationException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public Map<String, Object> conflict(DataIntegrityViolationException ex) {
        return Map.of("status", 409, "message", "Operazione in conflitto con i dati esistenti");
    }

    @ExceptionHandler(ExternalServiceException.class)
    @ResponseStatus(HttpStatus.SERVICE_UNAVAILABLE)
    public Map<String, Object> externalService(ExternalServiceException ex) {
        log.warn("Servizio esterno non disponibile: {}", ex.getCause() != null ? ex.getCause().getMessage() : "-");
        return Map.of("status", 503, "message", ex.getMessage());
    }

    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public Map<String, Object> generic(Exception ex) {
        log.error("Errore non gestito", ex);
        return Map.of("status", 500, "message", "Errore interno del server");
    }
}
