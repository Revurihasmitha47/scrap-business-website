package com.scrapflow.auth;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class LocalUserDetailsService implements UserDetailsService {
    private final JdbcTemplate jdbc;
    public LocalUserDetailsService(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    @Override public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        return jdbc.query("select email, password_hash, account_status from profiles where lower(email)=lower(?)",
            rs -> { if (!rs.next()) throw new UsernameNotFoundException("Invalid email or password");
                boolean active = "ACTIVE".equals(rs.getString("account_status"));
                return User.withUsername(rs.getString("email")).password(rs.getString("password_hash"))
                    .roles("USER").disabled(!active).build(); }, email);
    }
}
