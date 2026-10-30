package com.scrapflow.auth;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import java.util.*;

@Service
public class LocalUserService {
    private final JdbcTemplate jdbc; private final ObjectMapper mapper;
    public LocalUserService(JdbcTemplate jdbc, ObjectMapper mapper) { this.jdbc=jdbc; this.mapper=mapper; }
    public UserContext current(){Authentication a=SecurityContextHolder.getContext().getAuthentication();if(a==null||!a.isAuthenticated())throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,"Authentication required");try{return find(a.getName());}catch(Exception e){throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,"User account not found");}}
    public UserContext find(String email){Map<String,Object> p=jdbc.queryForMap("select id,email,full_name,phone,account_type,account_status from profiles where lower(email)=lower(?)",email);UUID id=(UUID)p.get("id");List<Map<String,Object>> m=jdbc.queryForList("select id,client_id,membership_role,is_active from client_memberships where user_id=? and is_active=true",id);return new UserContext(id,(String)p.get("email"),(String)p.get("full_name"),(String)p.get("phone"),(String)p.get("account_type"),(String)p.get("account_status"),mapper.valueToTree(m));}
    public UserContext requireRoles(String... allowed){UserContext c=current();for(String role:allowed)if(role.equals(c.accountType()))return c;throw new ResponseStatusException(HttpStatus.FORBIDDEN,"Role is not allowed");}
    public void requireClient(UserContext c,UUID client){if("SUPER_ADMIN".equals(c.accountType()))return;if("HOME_SELLER".equals(c.accountType())||"BULK_SELLER".equals(c.accountType())){Integer active=jdbc.queryForObject("select count(*) from clients where id=? and is_active=true",Integer.class,client);if(active!=null&&active>0)return;}Integer n=jdbc.queryForObject("select count(*) from client_memberships where user_id=? and client_id=? and is_active=true",Integer.class,c.userId(),client);if(n==null||n==0)throw new ResponseStatusException(HttpStatus.FORBIDDEN,"Client access denied");}
    public record UserContext(UUID userId,String email,String fullName,String phone,String accountType,String accountStatus,JsonNode memberships){}
}
