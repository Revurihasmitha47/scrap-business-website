package com.scrapflow.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegistrationRequest(
    @Email @NotBlank String email,
    @NotBlank @Size(min = 8, max = 128) String password,
    @NotBlank @Size(min = 2, max = 160) String fullName,
    @Pattern(regexp = "HOME_SELLER|BULK_SELLER") String accountType
) {}
