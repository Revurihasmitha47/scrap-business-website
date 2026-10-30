package com.scrapflow.controller;

import com.scrapflow.auth.LocalUserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.UUID;

@RestController @RequestMapping("/api/auth")
public class AuthController {
    private final JdbcTemplate jdbc; private final PasswordEncoder encoder; private final AuthenticationManager manager; private final LocalUserService users;
    private final HttpSessionSecurityContextRepository securityRepository = new HttpSessionSecurityContextRepository();
    public AuthController(JdbcTemplate jdbc, PasswordEncoder encoder, AuthenticationManager manager, LocalUserService users) { this.jdbc=jdbc; this.encoder=encoder; this.manager=manager; this.users=users; }

    @PostMapping("/register") @ResponseStatus(HttpStatus.CREATED)
    public LoginResponse register(@RequestBody RegisterRequest request, HttpServletRequest http) {
        if (request.email == null || !request.email.contains("@") || request.password == null || request.password.length() < 8 || request.fullName == null || request.fullName.isBlank()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Valid name, email and 8-character password are required");
        String type = "BULK_SELLER".equals(request.accountType) ? "BULK_SELLER" : "HOME_SELLER";
        UUID id = UUID.randomUUID();
        try { jdbc.update("insert into profiles(id,email,password_hash,full_name,account_type,account_status) values(?,?,?,?,?,'ACTIVE')", id, request.email.trim().toLowerCase(), encoder.encode(request.password), request.fullName.trim(), type); }
        catch (org.springframework.dao.DuplicateKeyException e) { throw new ResponseStatusException(HttpStatus.CONFLICT, "Email is already registered"); }
        return login(new LoginRequest(request.email, request.password), http);
    }

    @PostMapping("/login") public LoginResponse login(@RequestBody LoginRequest request, HttpServletRequest http) {
        var authentication = manager.authenticate(new UsernamePasswordAuthenticationToken(request.email.trim().toLowerCase(), request.password));
        SecurityContext context = SecurityContextHolder.createEmptyContext(); context.setAuthentication(authentication); SecurityContextHolder.setContext(context); securityRepository.saveContext(context, http, null);
        var user = users.find(authentication.getName());
        return new LoginResponse(user.userId(), user.email());
    }

    @PostMapping("/logout") @ResponseStatus(HttpStatus.NO_CONTENT) public void logout(HttpServletRequest request) { SecurityContextHolder.clearContext(); HttpSession s=request.getSession(false); if(s!=null) s.invalidate(); }
    @GetMapping("/session") public LoginResponse session() { var user = users.current(); return new LoginResponse(user.userId(), user.email()); }
    public record LoginRequest(@NotBlank @Email String email, @NotBlank String password) {}
    public record RegisterRequest(@NotBlank @Email String email, @NotBlank @Size(min=8) String password, @NotBlank String fullName, String accountType) {}
    public record LoginResponse(UUID userId, String email) {}
}
