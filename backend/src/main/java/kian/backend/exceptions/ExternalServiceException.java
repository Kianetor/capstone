package kian.backend.exceptions;

// Il servizio esterno non risponde o risponde con un errore: l'utente può sempre inserire i dati a mano
public class ExternalServiceException extends RuntimeException {
    public ExternalServiceException(String message, Throwable cause) {
        super(message, cause);
    }
}
