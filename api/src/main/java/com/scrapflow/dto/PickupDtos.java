package com.scrapflow.dto;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public final class PickupDtos {
    private PickupDtos() {}
    public record Item(@NotNull UUID categoryId, @NotNull @DecimalMin("0.01") BigDecimal estimatedQuantity) {}
    public record Create(@NotNull UUID clientId, @NotNull JsonNode pickupAddress,
                         @NotNull LocalDate preferredDate, @NotEmpty List<@Valid Item> items, String preferredTime) {}
    public record ItemWeight(@NotNull UUID itemId, @NotNull @DecimalMin("0.00") BigDecimal actualWeight) {}
    public record StaffUpdate(@NotBlank String status, @NotEmpty List<@Valid ItemWeight> itemWeights) {}
    public record Assign(@NotNull UUID staffUserId) {}
    public record Status(@NotBlank String status) {}
}
