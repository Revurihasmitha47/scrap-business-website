package com.scrapflow.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public final class AdminDtos {
    private AdminDtos() {}
    public record Client(@NotBlank String name, @NotBlank String slug) {}
    public record Category(@NotNull UUID clientId, @NotBlank String name) {}
    public record Rate(@NotNull UUID clientId, @NotNull UUID categoryId, @NotNull @DecimalMin("0.00") BigDecimal ratePerKg, Instant effectiveFrom) {}
}
