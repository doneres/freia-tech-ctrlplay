package br.com.ctrlplaygoiania.feiratech.exception;

import java.util.UUID;

public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String recurso, UUID id) {
        super(recurso + " não encontrado com id: " + id);
    }

    public ResourceNotFoundException(String message) {
        super(message);
    }
}
