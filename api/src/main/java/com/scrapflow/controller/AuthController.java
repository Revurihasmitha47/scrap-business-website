package com.scrapflow.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
        if (request.mobileNumber() == null || !request.mobileNumber().matches("^[0-9+()\\- ]{7,20}$"))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A valid mobile number is required");
        if ("BULK_SELLER".equals(type) && (request.businessName() == null || request.businessName().isBlank()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Business name is required for Bulk Seller registration");
        if (request.gstin() != null && !request.gstin().isBlank() && !request.gstin().matches("^[0-9A-Z]{15}$"))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "GSTIN must contain 15 letters and numbers");
        if (request.approximateQuantity() != null && request.approximateQuantity().signum() < 0)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Approximate quantity cannot be negative");
        UUID id = UUID.randomUUID();
        try {
            jdbc.update("insert into profiles(id,email,password_hash,full_name,phone,account_type,email_verified) values(?,?,?,?,?,?,true)",
                    id, normalize(request.email()), encoder.encode(request.password()), request.fullName().trim(), request.mobileNumber(), type);
            jdbc.update("insert into seller_profiles(user_id,business_name,gstin,approximate_quantity) values(?,?,?,?)",
                    id, request.businessName(), request.gstin(), request.approximateQuantity());
        } catch (DuplicateKeyException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email is already registered");
        }
        return establishSession(id, normalize(request.email()), type, http, false);
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
        return establishSession(id, normalize(request.email()), "ADMIN", http, false);
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
            user = jdbc.queryForMap("select id,email,password_hash,account_type,account_status,must_change_password from profiles where lower(email)=lower(?)", normalize(request.email()));
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Email or password is incorrect");
        }
        if (!encoder.matches(request.password(), (String) user.get("password_hash"))) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Email or password is incorrect");
        if (!"ACTIVE".equals(user.get("account_status"))) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This account is inactive");
        return establishSession((UUID) user.get("id"), (String) user.get("email"), (String) user.get("account_type"), http, Boolean.TRUE.equals(user.get("must_change_password")));
    }

    @GetMapping("/session")
    public ResponseEntity<SessionResponse> session(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session == null || session.getAttribute("userId") == null) return ResponseEntity.ok().build();
        return ResponseEntity.ok(new SessionResponse((UUID) session.getAttribute("userId"), (String) session.getAttribute("email"), (String) session.getAttribute("fullName"), (String) session.getAttribute("accountType"), Boolean.TRUE.equals(session.getAttribute("mustChangePassword"))));
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session != null) session.invalidate();
    }

    @PostMapping("/change-password")
    public SessionResponse changePassword(@Valid @RequestBody PasswordChange request, HttpServletRequest http) {
        HttpSession session = http.getSession(false);
        if (session == null || session.getAttribute("userId") == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sign in required");
        UUID id = (UUID) session.getAttribute("userId");
        Map<String,Object> user = jdbc.queryForMap("select email,account_type,password_hash from profiles where id=?", id);
        if (!encoder.matches(request.currentPassword(), (String) user.get("password_hash"))) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Current password is incorrect");
        jdbc.update("update profiles set password_hash=?,must_change_password=false,updated_at=now() where id=?", encoder.encode(request.newPassword()), id);
        return establishSession(id, (String) user.get("email"), (String) user.get("account_type"), http, false);
    }

    @PostMapping("/accept-invite")
    @ResponseStatus(HttpStatus.CREATED)
    public SessionResponse acceptInvite(@Valid @RequestBody InviteAcceptance request, HttpServletRequest http) {
        Map<String, Object> invite;
        try { invite = jdbc.queryForMap("select id,email,full_name,phone,service_area,expires_at,accepted_at,invited_by from staff_invitations where token_hash=?", hash(request.token())); }
        catch (Exception e) { throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Invitation not found"); }
        if (invite.get("accepted_at") != null || ((java.sql.Timestamp) invite.get("expires_at")).toInstant().isBefore(java.time.Instant.now())) throw new ResponseStatusException(HttpStatus.GONE, "Invitation has expired or was already used");
        UUID id = UUID.randomUUID(); String email = (String) invite.get("email");
        String invitedName = invite.get("full_name") == null ? request.fullName().trim() : String.valueOf(invite.get("full_name"));
        String invitedPhone = invite.get("phone") == null ? null : String.valueOf(invite.get("phone"));
        String invitedArea = invite.get("service_area") == null ? null : String.valueOf(invite.get("service_area"));
        try { jdbc.update("insert into profiles(id,email,password_hash,full_name,phone,service_area,account_type,email_verified) values(?,?,?,?,?,?, 'STAFF', true)", id, email, encoder.encode(request.password()), invitedName, invitedPhone, invitedArea); }
        catch (DuplicateKeyException e) { throw new ResponseStatusException(HttpStatus.CONFLICT, "Email is already registered"); }
        jdbc.update("update staff_invitations set accepted_at=now() where id=?", invite.get("id"));
        return establishSession(id, email, "STAFF", http, false);
    }

    private SessionResponse establishSession(UUID id, String email, String type, HttpServletRequest request, boolean mustChangePassword) {
        HttpSession session = request.getSession(true);
        String fullName = jdbc.queryForObject("select full_name from profiles where id=?", String.class, id);
        session.setAttribute("userId", id); session.setAttribute("email", email); session.setAttribute("fullName", fullName); session.setAttribute("accountType", type); session.setAttribute("mustChangePassword", mustChangePassword);
        return new SessionResponse(id, email, fullName, type, mustChangePassword);
    }

    private String normalize(String email) { return email.trim().toLowerCase(); }
    private String hash(String value) { try { return Base64.getEncoder().encodeToString(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8))); } catch (Exception e) { throw new IllegalStateException(e); } }

    public record SessionResponse(UUID userId, String email, String fullName, String accountType, boolean mustChangePassword) {}
    public record LoginRequest(@NotBlank @Email String email, @NotBlank String password) {}
    public record AdminRegistration(@NotBlank String fullName, @NotBlank @Email String email, @NotBlank @Size(min = 8) String password, String mobileNumber) {}
    public record SellerRegistration(@NotBlank String fullName, @NotBlank @Email String email, @NotBlank @Size(min = 8) String password,
                                     String mobileNumber, String accountType, String businessName, String gstin, BigDecimal approximateQuantity) {}
    public record InviteAcceptance(@NotBlank String token, @NotBlank String fullName, @NotBlank @Size(min = 8) String password) {}
    public record PasswordChange(@NotBlank String currentPassword, @NotBlank @Size(min = 8) String newPassword) {}
}
