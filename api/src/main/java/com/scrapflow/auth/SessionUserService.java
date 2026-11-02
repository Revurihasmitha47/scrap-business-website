package com.scrapflow.auth;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import java.util.UUID;

@Service
public class SessionUserService {
    private final HttpServletRequest request;
    public SessionUserService(HttpServletRequest request) { this.request = request; }
    public User current() {
        HttpSession session = request.getSession(false);
        if (session == null || session.getAttribute("userId") == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sign in required");
        return new User((UUID) session.getAttribute("userId"), (String) session.getAttribute("email"), (String) session.getAttribute("accountType"));
    }
    public User require(String... roles) {
        User user = current();
        for (String role : roles) if (role.equals(user.role())) return user;
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have permission for this action");
    }
    public record User(UUID id, String email, String role) {}
}
