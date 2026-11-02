package com.scrapflow.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.scrapflow.auth.SessionUserService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.math.BigDecimal;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.*;

@RestController
@RequestMapping("/api")
public class BusinessController {
    private final JdbcTemplate jdbc; private final SessionUserService users; private final ObjectMapper mapper;
    public BusinessController(JdbcTemplate jdbc, SessionUserService users, ObjectMapper mapper) { this.jdbc=jdbc; this.users=users; this.mapper=mapper; }

    @GetMapping("/me") public Map<String,Object> me() { var u=users.current(); return Map.of("id",u.id(),"email",u.email(),"role",u.role()); }
    @GetMapping("/categories") public List<Map<String,Object>> categories() { users.current(); return jdbc.queryForList("select id,name from scrap_categories where is_active=true order by name"); }
    @GetMapping("/rates") public List<Map<String,Object>> rates() { var u=users.require("ADMIN","HOME_SELLER","BULK_SELLER"); String column="HOME_SELLER".equals(u.role())?"home_seller_rate":"BULK_SELLER".equals(u.role())?"bulk_seller_rate":"home_seller_rate"; return jdbc.queryForList("select c.id,c.name,r.home_seller_rate,r.bulk_seller_rate,r."+column+" as rate from scrap_categories c left join lateral (select * from scrap_rates where category_id=c.id order by effective_from desc limit 1) r on true where c.is_active=true order by c.name"); }

    @PostMapping("/admin/categories") @ResponseStatus(HttpStatus.CREATED)
    public Map<String,Object> createCategory(@Valid @RequestBody CategoryRequest request) { users.require("ADMIN"); UUID id=UUID.randomUUID(); try { jdbc.update("insert into scrap_categories(id,name) values(?,?)",id,request.name().trim()); } catch(Exception e){throw new ResponseStatusException(HttpStatus.CONFLICT,"Category already exists");} return Map.of("id",id,"name",request.name().trim()); }

    @PostMapping("/admin/rates") @ResponseStatus(HttpStatus.CREATED)
    public Map<String,Object> publishRates(@Valid @RequestBody RateRequest request) { var u=users.require("ADMIN"); if(request.homeSellerRate().signum()<=0||request.bulkSellerRate().signum()<=0) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Rates must be positive"); UUID id=UUID.randomUUID(); jdbc.update("insert into scrap_rates(id,category_id,home_seller_rate,bulk_seller_rate,changed_by) values(?,?,?,?,?)",id,request.categoryId(),request.homeSellerRate(),request.bulkSellerRate(),u.id()); return Map.of("id",id,"categoryId",request.categoryId(),"homeSellerRate",request.homeSellerRate(),"bulkSellerRate",request.bulkSellerRate()); }

    @GetMapping("/admin/staff") public List<Map<String,Object>> staff() { users.require("ADMIN"); return jdbc.queryForList("select id,full_name,email,account_status,created_at from profiles where account_type='STAFF' order by created_at desc"); }
    @PostMapping("/admin/staff/invite") @ResponseStatus(HttpStatus.CREATED)
    public Map<String,Object> inviteStaff(@Valid @RequestBody InviteRequest request) { var u=users.require("ADMIN"); byte[] bytes=new byte[32]; new SecureRandom().nextBytes(bytes); String token=Base64.getUrlEncoder().withoutPadding().encodeToString(bytes); jdbc.update("insert into staff_invitations(email,token_hash,invited_by,expires_at) values(?,?,?,?)",request.email().trim().toLowerCase(),hash(token),u.id(),java.sql.Timestamp.from(Instant.now().plusSeconds(86400))); return Map.of("email",request.email().trim().toLowerCase(),"token",token,"expiresInHours",24); }

    @PostMapping("/pickups") @ResponseStatus(HttpStatus.CREATED)
    public Map<String,Object> createPickup(@Valid @RequestBody PickupRequest request) { var u=users.require("HOME_SELLER","BULK_SELLER"); if(request.items().isEmpty()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"At least one scrap item is required"); UUID id=UUID.randomUUID(); BigDecimal total=BigDecimal.ZERO; jdbc.update("insert into pickup_requests(id,seller_id,pickup_address,preferred_date,preferred_time,estimated_amount) values(?,?,cast(? as jsonb),?,?,0)",id,u.id(),json(request.address()),request.preferredDate(),request.preferredTime()); for(Item item:request.items()){BigDecimal rate=rateFor(item.categoryId(),u.role()); total=total.add(rate.multiply(item.estimatedQuantity())); jdbc.update("insert into pickup_items(pickup_id,category_id,estimated_quantity,saved_rate) values(?,?,?,?)",id,item.categoryId(),item.estimatedQuantity(),rate);} jdbc.update("update pickup_requests set estimated_amount=? where id=?",total,id); recordStatus(id,"SUBMITTED",u.id(),null); return pickup(id); }

    @GetMapping("/pickups") public List<Map<String,Object>> pickups() { var u=users.current(); if("ADMIN".equals(u.role())) return jdbc.queryForList("select p.*,s.full_name seller_name,s.email seller_email from pickup_requests p join profiles s on s.id=p.seller_id order by p.created_at desc"); if("STAFF".equals(u.role())) return jdbc.queryForList("select p.*,s.full_name seller_name,s.email seller_email from pickup_requests p join profiles s on s.id=p.seller_id where p.assigned_staff_id=? order by p.created_at desc",u.id()); return jdbc.queryForList("select * from pickup_requests where seller_id=? order by created_at desc",u.id()); }
    @GetMapping("/pickups/{id}") public Map<String,Object> pickupDetail(@PathVariable UUID id) { var u=users.current(); Map<String,Object> p=pickup(id); if(!"ADMIN".equals(u.role())&&!u.id().equals(p.get("seller_id"))&&!u.id().equals(p.get("assigned_staff_id"))) throw new ResponseStatusException(HttpStatus.FORBIDDEN,"Pickup access denied"); return p; }
    @PostMapping("/pickups/{id}/cancel") public Map<String,Object> cancel(@PathVariable UUID id) { var u=users.require("HOME_SELLER","BULK_SELLER"); Map<String,Object> p=pickup(id); if(!u.id().equals(p.get("seller_id"))) throw new ResponseStatusException(HttpStatus.FORBIDDEN,"Pickup access denied"); changeStatus(id,"CANCELLED",u.id(),"Cancelled by seller"); return pickup(id); }
    @PostMapping("/admin/pickups/{id}/status") public Map<String,Object> adminStatus(@PathVariable UUID id,@Valid @RequestBody StatusRequest request){var u=users.require("ADMIN");changeStatus(id,request.status(),u.id(),request.reason());return pickup(id);}
    @PostMapping("/admin/pickups/{id}/assign") public Map<String,Object> assign(@PathVariable UUID id,@Valid @RequestBody AssignRequest request){var u=users.require("ADMIN");Integer n=jdbc.queryForObject("select count(*) from profiles where id=? and account_type='STAFF' and account_status='ACTIVE'",Integer.class,request.staffId());if(n==null||n==0)throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Active Staff account required");jdbc.update("update pickup_requests set assigned_staff_id=?,status='ASSIGNED',updated_at=now() where id=?",request.staffId(),id);recordStatus(id,"ASSIGNED",u.id(),null);return pickup(id);}
    @PostMapping("/staff/pickups/{id}/collect") public Map<String,Object> collect(@PathVariable UUID id,@Valid @RequestBody CollectionRequest request){var u=users.require("STAFF");Map<String,Object> p=pickup(id);if(!u.id().equals(p.get("assigned_staff_id")))throw new ResponseStatusException(HttpStatus.FORBIDDEN,"Pickup is not assigned to you");jdbc.update("update pickup_requests set actual_weight=?,actual_amount=(select coalesce(sum(? * saved_rate),0) from pickup_items where pickup_id=?),collection_notes=?,updated_at=now() where id=?",request.actualWeight(),request.actualWeight(),id,request.notes(),id);changeStatus(id,"COLLECTED",u.id(),request.notes());return pickup(id);}
    @PostMapping("/staff/pickups/{id}/status") public Map<String,Object> staffStatus(@PathVariable UUID id,@Valid @RequestBody StatusRequest request){var u=users.require("STAFF");Map<String,Object> p=pickup(id);if(!u.id().equals(p.get("assigned_staff_id")))throw new ResponseStatusException(HttpStatus.FORBIDDEN,"Pickup is not assigned to you");if(!Set.of("ON_THE_WAY","ASSIGNED").contains(request.status()))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Staff cannot set this status");changeStatus(id,request.status(),u.id(),request.reason());return pickup(id);}
    @PostMapping("/staff/pickups/{id}/unable") public Map<String,Object> unable(@PathVariable UUID id,@Valid @RequestBody StatusRequest request){var u=users.require("STAFF");Map<String,Object> p=pickup(id);if(!u.id().equals(p.get("assigned_staff_id")))throw new ResponseStatusException(HttpStatus.FORBIDDEN,"Pickup is not assigned to you");changeStatus(id,"UNABLE_TO_COLLECT",u.id(),request.reason());return pickup(id);}

    private BigDecimal rateFor(UUID category,String role){String column="HOME_SELLER".equals(role)?"home_seller_rate":"bulk_seller_rate";try{return jdbc.queryForObject("select "+column+" from scrap_rates where category_id=? order by effective_from desc limit 1",BigDecimal.class,category);}catch(Exception e){throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"No active rate exists for this scrap category");}}
    private Map<String,Object> pickup(UUID id){try{return jdbc.queryForMap("select p.*,s.full_name seller_name,s.email seller_email from pickup_requests p join profiles s on s.id=p.seller_id where p.id=?",id);}catch(Exception e){throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Pickup not found");}}
    private void changeStatus(UUID id,String status,UUID actor,String reason){Set<String> allowed=Set.of("SUBMITTED","CONFIRMED","ASSIGNED","ON_THE_WAY","COLLECTED","COMPLETED","REJECTED","CANCELLED","UNABLE_TO_COLLECT");if(!allowed.contains(status))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Invalid pickup status");jdbc.update("update pickup_requests set status=?,rejection_reason=?,updated_at=now() where id=?",status,reason,id);recordStatus(id,status,actor,reason);}
    private void recordStatus(UUID id,String status,UUID actor,String reason){jdbc.update("insert into pickup_status_history(pickup_id,status,changed_by,reason) values(?,?,?,?)",id,status,actor,reason);}
    private String json(Object value){try{return mapper.writeValueAsString(value);}catch(Exception e){throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Invalid pickup address");}}
    private String hash(String value){try{return Base64.getEncoder().encodeToString(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)));}catch(Exception e){throw new IllegalStateException(e);}}

    public record CategoryRequest(@NotBlank String name){}
    public record RateRequest(@NotNull UUID categoryId,@NotNull BigDecimal homeSellerRate,@NotNull BigDecimal bulkSellerRate){}
    public record InviteRequest(@NotBlank String email){}
    public record AssignRequest(@NotNull UUID staffId){}
    public record StatusRequest(@NotBlank String status,String reason){}
    public record CollectionRequest(@NotNull @Positive BigDecimal actualWeight,String notes){}
    public record PickupRequest(@NotNull Object address,@NotNull String preferredDate,String preferredTime,@NotEmpty List<Item> items){}
    public record Item(@NotNull UUID categoryId,@NotNull @Positive BigDecimal estimatedQuantity){}
}
