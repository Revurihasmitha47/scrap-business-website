package com.scrapflow.controller;

import com.scrapflow.auth.SessionUserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {
    private final JdbcTemplate jdbc; private final SessionUserService users;
    public ProfileController(JdbcTemplate jdbc, SessionUserService users) { this.jdbc=jdbc; this.users=users; }

    @GetMapping
    public Map<String,Object> profile() {
        var u=users.current();
        return jdbc.queryForMap("select p.id,p.email,p.full_name,p.middle_name,p.phone,p.gender,p.country,p.state,p.city,p.address_line1,p.address_line2,p.zip_code,p.profile_image_url,p.account_type,p.account_status,p.created_at,sp.business_name,sp.gstin,sp.approximate_quantity from profiles p left join seller_profiles sp on sp.user_id=p.id where p.id=?",u.id());
    }

    @PutMapping
    public Map<String,Object> update(@Valid @RequestBody ProfileUpdate request, HttpServletRequest http) {
        var u=users.current();
        jdbc.update("update profiles set full_name=?,middle_name=?,phone=?,gender=?,country=?,state=?,city=?,address_line1=?,address_line2=?,zip_code=?,profile_image_url=?,updated_at=now() where id=?",
                request.fullName().trim(),request.middleName(),request.phone(),request.gender(),request.country(),request.state(),request.city(),request.addressLine1(),request.addressLine2(),request.zipCode(),request.profileImageUrl(),u.id());
        if ("HOME_SELLER".equals(u.role()) || "BULK_SELLER".equals(u.role())) {
            jdbc.update("insert into seller_profiles(user_id,business_name,gstin,approximate_quantity) values(?,?,?,?) on conflict(user_id) do update set business_name=excluded.business_name,gstin=excluded.gstin,approximate_quantity=excluded.approximate_quantity,updated_at=now()",u.id(),request.businessName(),request.gstin(),request.approximateQuantity());
        }
        HttpSession session=http.getSession(false); if(session!=null) session.setAttribute("fullName",request.fullName().trim());
        return profile();
    }

    public record ProfileUpdate(@NotBlank String fullName, String middleName, String phone, String gender, String country, String state, String city, String addressLine1, String addressLine2, String zipCode, String profileImageUrl, String businessName, String gstin, BigDecimal approximateQuantity) {}
}
