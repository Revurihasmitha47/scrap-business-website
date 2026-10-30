package com.scrapflow.dto;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.UUID;

public final class ApiDtos {
    private ApiDtos() {}
    public record Me(UUID id, String fullName, String phone, String accountType, String accountStatus, JsonNode memberships) {}
}
