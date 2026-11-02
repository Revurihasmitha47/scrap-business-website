package com.scrapflow.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;
import java.security.MessageDigest;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final JdbcTemplate jdbc;
    private final PasswordEncoder encoder;

    public AuthController(JdbcTemplate jdbc, PasswordEncoder encoder) {
        this.jdbc = jdbc;
        this.encoder = encoder;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public SessionResponse register(@Valid @RequestBody SellerRegistration request, HttpServletRequest http) {
        String type = "BULK_SELLER".equals(request.accountType()) ? "BULK_SELLER" : "HOME_SELLER";
        UUID id = UUID.randomUUID();
        try {
            jdbc.update("insert into profiles(id,email,password_hash,full_name,phone,account_type,email_verified) values(?,?,?,?,?,?,true)",
                    id, normalize(request.email()), encoder.encode(request.password()), request.fullName().trim(), request.mobileNumber(), type);
            jdbc.update("insert into seller_profiles(user_id,business_name,gstin,approximate_quantity) values(?,?,?,?)",
                    id, request.businessName(), request.gstin(), request.approximateQuantity());
        } catch (DuplicateKeyException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email is already registered");
        }
        return establishSession(id, normalize(request.email()), type, http);
    }

    @PostMapping("/setup/admin")
    @ResponseStatus(HttpStatus.CREATED)
    public SessionResponse setupAdmin(@Valid @RequestBody AdminRegistration request, HttpServletRequest http) {
        Integer existing = jdbc.queryForObject("select count(*) from profiles where account_type='ADMIN'", Integer.class);
        if (existing != null && existing > 0) throw new ResponseStatusException(HttpStatus.CONFLICT, "Admin registration is already closed");
        UUID id = UUID.randomUUID();
        try {
            jdbc.update("insert into profiles(id,email,password_hash,full_name,phone,account_type,email_verified) values(?,?,?,?,?,'ADMIN',true)",
                    id, normalize(request.email()), encoder.encode(request.password()), request.fullName().trim(), request.mobileNumber());
        } catch (DuplicateKeyException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email is already registered");
        }
        return establishSession(id, normalize(request.email()), "ADMIN", http);
    }

    @GetMapping("/setup/status")
    public Map<String, Boolean> adminSetupStatus() {
        Integer existing = jdbc.queryForObject("select count(*) from profiles where account_type='ADMIN'", Integer.class);
        return Map.of("available", existing == null || existing == 0);
    }

    @PostMapping("/login")
    public SessionResponse login(@Valid @RequestBody LoginRequest request, HttpServletRequest http) {
        Map<String, Object> user;
        try {
            user = jdbc.queryForMap("select id,email,password_hash,account_type,account_status from profiles where lower(email)=lower(?)", normalize(request.email()));
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Email or password is incorrect");
        }
        if (!encoder.matches(request.password(), (String) user.get("password_hash"))) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Email or password is incorrect");
        if (!"ACTIVE".equals(user.get("account_status"))) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This account is inactive");
        return establishSession((UUID) user.get("id"), (String) user.get("email"), (String) user.get("account_type"), http);
    }

    @GetMapping("/session")
    public SessionResponse session(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session == null || session.getAttribute("userId") == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not signed in");
        return new SessionResponse((UUID) session.getAttribute("userId"), (String) session.getAttribute("email"), (String) session.getAttribute("fullName"), (String) session.getAttribute("accountType"));
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session != null) session.invalidate();
    }

    @PostMapping("/accept-invite")
    @ResponseStatus(HttpStatus.CREATED)
    public SessionResponse acceptInvite(@Valid @RequestBody InviteAcceptance request, HttpServletRequest http) {
        Map<String, Object> invite;
        try { invite = jdbc.queryForMap("select id,email,expires_at,accepted_at,invited_by from staff_invitations where token_hash=?", hash(request.token())); }
        catch (Exception e) { throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Invitation not found"); }
        if (invite.get("accepted_at") != null || ((java.sql.Timestamp) invite.get("expires_at")).toInstant().isBefore(java.time.Instant.now())) throw new ResponseStatusException(HttpStatus.GONE, "Invitation has expired or was already used");
        UUID id = UUID.randomUUID(); String email = (String) invite.get("email");
        try { jdbc.update("insert into profiles(id,email,password_hash,full_name,account_type,email_verified) values(?,?,?,?, 'STAFF', true)", id, email, encoder.encode(request.password()), request.fullName().trim()); }
        catch (DuplicateKeyException e) { throw new ResponseStatusException(HttpStatus.CONFLICT, "Email is already registered"); }
        jdbc.update("update staff_invitations set accepted_at=now() where id=?", invite.get("id"));
        return establishSession(id, email, "STAFF", http);
    }

    private SessionResponse establishSession(UUID id, String email, String type, HttpServletRequest request) {
        HttpSession session = request.getSession(true);
        String fullName = jdbc.queryForObject("select full_name from profiles where id=?", String.class, id);
        session.setAttribute("userId", id); session.setAttribute("email", email); session.setAttribute("fullName", fullName); session.setAttribute("accountType", type);
        return new SessionResponse(id, email, fullName, type);
    }

    private String normalize(String email) { return email.trim().toLowerCase(); }
    private String hash(String value) { try { return Base64.getEncoder().encodeToString(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8))); } catch (Exception e) { throw new IllegalStateException(e); } }

    public record SessionResponse(UUID userId, String email, String fullName, String accountType) {}
    public record LoginRequest(@NotBlank @Email String email, @NotBlank String password) {}
    public record AdminRegistration(@NotBlank String fullName, @NotBlank @Email String email, @NotBlank @Size(min = 8) String password, String mobileNumber) {}
    public record SellerRegistration(@NotBlank String fullName, @NotBlank @Email String email, @NotBlank @Size(min = 8) String password,
                                     String mobileNumber, String accountType, String businessName, String gstin, BigDecimal approximateQuantity) {}
    public record InviteAcceptance(@NotBlank String token, @NotBlank String fullName, @NotBlank @Size(min = 8) String password) {}
}
