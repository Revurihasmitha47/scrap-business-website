package com.scrapflow.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.scrapflow.auth.SessionUserService;
import com.scrapflow.service.EmailService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import org.springframework.http.HttpStatus;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import java.nio.file.Files;
import java.nio.file.Path;
import java.math.BigDecimal;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api")
public class BusinessController {
    private static final Logger log = LoggerFactory.getLogger(BusinessController.class);
    private final JdbcTemplate jdbc; private final SessionUserService users; private final ObjectMapper mapper; private final PasswordEncoder encoder; private final EmailService emailService; private final String appBaseUrl;
    public BusinessController(JdbcTemplate jdbc, SessionUserService users, ObjectMapper mapper, PasswordEncoder encoder, EmailService emailService, @Value("${APP_BASE_URL:http://localhost:4200}") String appBaseUrl) { this.jdbc=jdbc; this.users=users; this.mapper=mapper; this.encoder=encoder; this.emailService=emailService; this.appBaseUrl=appBaseUrl; }

    @GetMapping("/me") public Map<String,Object> me() { var u=users.current(); return Map.of("id",u.id(),"email",u.email(),"role",u.role()); }
    @GetMapping("/categories") public List<Map<String,Object>> categories() { users.current(); return jdbc.queryForList("select id,name from scrap_categories where is_active=true order by name"); }
    @GetMapping("/admin/categories") public List<Map<String,Object>> adminCategories() { users.require("ADMIN"); return jdbc.queryForList("select id,name,description,is_active,created_at from scrap_categories order by name"); }
    @GetMapping("/rates") public List<Map<String,Object>> rates() { var u=users.require("ADMIN","HOME_SELLER","BULK_SELLER"); if("ADMIN".equals(u.role())) return jdbc.queryForList("select c.id,c.name,r.home_seller_rate,r.bulk_seller_rate,r.effective_from from scrap_categories c left join lateral (select * from scrap_rates where category_id=c.id and effective_from <= now() order by effective_from desc limit 1) r on true where c.is_active=true order by c.name"); String column="HOME_SELLER".equals(u.role())?"home_seller_rate":"bulk_seller_rate"; return jdbc.queryForList("select c.id,c.name,r."+column+" as rate,r.effective_from from scrap_categories c left join lateral (select "+column+",effective_from from scrap_rates where category_id=c.id and effective_from <= now() order by effective_from desc limit 1) r on true where c.is_active=true order by c.name"); }

    @PostMapping("/admin/categories") @ResponseStatus(HttpStatus.CREATED)
    public Map<String,Object> createCategory(@Valid @RequestBody CategoryRequest request) { users.require("ADMIN"); UUID id=UUID.randomUUID(); boolean active=request.isActive()==null||request.isActive(); try { jdbc.update("insert into scrap_categories(id,name,description,is_active) values(?,?,?,?)",id,request.name().trim(),request.description(),active); } catch(DuplicateKeyException e){throw new ResponseStatusException(HttpStatus.CONFLICT,"Category already exists");} return Map.of("id",id,"name",request.name().trim(),"description",request.description()==null?"":request.description(),"is_active",active); }

    @PatchMapping("/admin/categories/{id}")
    public Map<String,Object> updateCategory(@PathVariable UUID id,@Valid @RequestBody CategoryRequest request) {
        users.require("ADMIN");
        String name = request.name().trim();
        boolean active = request.isActive()==null||request.isActive();
        try {
            int updated = jdbc.update("update scrap_categories set name=?,description=?,is_active=? where id=?", name, request.description(), active, id);
            if (updated == 0) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Category not found");
            return jdbc.queryForMap("select id,name,description,is_active,created_at from scrap_categories where id=?", id);
        } catch (DuplicateKeyException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Category already exists");
        }
    }

    @DeleteMapping("/admin/categories/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteCategory(@PathVariable UUID id) {
        users.require("ADMIN");
        try {
            int deleted = jdbc.update("delete from scrap_categories where id=?", id);
            if (deleted == 0) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Category not found");
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Category is already used and cannot be deleted");
        }
    }

    @PostMapping("/admin/rates") @ResponseStatus(HttpStatus.CREATED)
    public Map<String,Object> publishRates(@Valid @RequestBody RateRequest request) { var u=users.require("ADMIN"); if(request.homeSellerRate().signum()<=0||request.bulkSellerRate().signum()<=0) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Rates must be positive"); UUID id=UUID.randomUUID(); jdbc.update("insert into scrap_rates(id,category_id,home_seller_rate,bulk_seller_rate,changed_by) values(?,?,?,?,?)",id,request.categoryId(),request.homeSellerRate(),request.bulkSellerRate(),u.id()); return Map.of("id",id,"categoryId",request.categoryId(),"homeSellerRate",request.homeSellerRate(),"bulkSellerRate",request.bulkSellerRate()); }

    @DeleteMapping("/admin/rates/{categoryId}") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteRate(@PathVariable UUID categoryId) {
        users.require("ADMIN");
        int deleted = jdbc.update("delete from scrap_rates where id=(select id from scrap_rates where category_id=? order by effective_from desc limit 1)", categoryId);
        if (deleted == 0) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Rate not found");
    }

    @GetMapping("/admin/staff") public List<Map<String,Object>> staff() { users.require("ADMIN"); return jdbc.queryForList("select p.id,p.full_name,p.email,p.phone,p.service_area,p.account_status,p.availability_status,p.created_at,(select count(*) from pickup_requests x where x.assigned_staff_id=p.id and x.status not in ('COMPLETED','CANCELLED','REJECTED')) assigned_pickups,(select count(*) from pickup_requests x where x.assigned_staff_id=p.id and x.status='COMPLETED') completed_pickups from profiles p where p.account_type='STAFF' order by p.created_at desc"); }
    @PatchMapping("/admin/staff/{id}")
    public Map<String,Object> updateStaff(@PathVariable UUID id, @Valid @RequestBody StaffUpdateRequest request) {
        users.require("ADMIN");
        int updated = jdbc.update("update profiles set full_name=?,phone=?,service_area=?,account_status=? where id=? and account_type='STAFF'", request.fullName().trim(), request.phone(), request.serviceArea(), request.accountStatus(), id);
        if (updated == 0) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Staff not found");
        return jdbc.queryForMap("select id,full_name,email,phone,service_area,account_status,availability_status from profiles where id=?", id);
    }
    @DeleteMapping("/admin/staff/{id}") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteStaff(@PathVariable UUID id) {
        users.require("ADMIN");
        try { int deleted = jdbc.update("delete from profiles where id=? and account_type='STAFF'", id); if (deleted == 0) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Staff not found"); }
        catch (org.springframework.dao.DataIntegrityViolationException e) { throw new ResponseStatusException(HttpStatus.CONFLICT, "Staff with assigned pickup history cannot be deleted"); }
    }
    @PostMapping("/admin/staff/invite") @ResponseStatus(HttpStatus.CREATED)
    public Map<String,Object> inviteStaff(@Valid @RequestBody InviteRequest request) { var u=users.require("ADMIN"); String email=request.email().trim().toLowerCase(); String setup="TEMPORARY".equalsIgnoreCase(request.setupMode())?"TEMPORARY":"INVITE"; if(request.fullName()==null||request.fullName().isBlank())throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Full name is required"); if("TEMPORARY".equals(setup)){if(request.temporaryPassword()==null||request.temporaryPassword().length()<8)throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Temporary password must contain at least 8 characters");try{UUID id=UUID.randomUUID();jdbc.update("insert into profiles(id,email,password_hash,full_name,phone,service_area,account_type,account_status,email_verified,must_change_password) values(?,?,?,?,?,?, 'STAFF','ACTIVE',true,true)",id,email,encoder.encode(request.temporaryPassword()),request.fullName().trim(),request.mobileNumber(),request.serviceArea());return Map.of("email",email,"accountCreated",true,"id",id);}catch(DuplicateKeyException e){throw new ResponseStatusException(HttpStatus.CONFLICT,"A Staff account with this email already exists. Use a different email or open the existing Staff profile.");}catch(Exception e){throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,"Staff account could not be created. Check that V4__admin_operations_foundation.sql and V6__staff_password_change.sql are applied.");}} byte[] bytes=new byte[32]; new SecureRandom().nextBytes(bytes); String token=Base64.getUrlEncoder().withoutPadding().encodeToString(bytes); try{jdbc.update("insert into staff_invitations(email,full_name,phone,service_area,setup_mode,token_hash,invited_by,expires_at) values(?,?,?,?,?,?,?,?)",email,request.fullName(),request.mobileNumber(),request.serviceArea(),setup,hash(token),u.id(),java.sql.Timestamp.from(Instant.now().plusSeconds(86400)));}catch(DuplicateKeyException e){throw new ResponseStatusException(HttpStatus.CONFLICT,"A Staff invitation already exists for this email.");}catch(Exception e){throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,"Staff invitation storage is not ready. Apply V5__staff_invitation_details.sql first.");} safeSend("STAFF_INVITATION", email, Map.of("fullName",request.fullName(),"inviteUrl",inviteUrl(token),"expiresInHours",24)); return Map.of("email",email,"token",token,"expiresInHours",24); }

    private String inviteUrl(String token) { return appBaseUrl + "/staff/accept-invite?token=" + token; }

    @PostMapping("/pickups") @ResponseStatus(HttpStatus.CREATED) @Transactional
    public Map<String,Object> createPickup(@RequestHeader(value="Idempotency-Key", required=false) String idempotencyKey, @Valid @RequestBody PickupRequest request) { var u=users.require("HOME_SELLER","BULK_SELLER"); if(request.items().isEmpty()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"At least one scrap item is required"); if(request.items().stream().map(Item::categoryId).distinct().count()!=request.items().size()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Each scrap category can be added only once"); LocalDate pickupDate; try{pickupDate=LocalDate.parse(request.preferredDate());}catch(Exception e){throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Preferred pickup date is invalid");}if(pickupDate.isBefore(LocalDate.now()))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Preferred pickup date cannot be in the past");if(request.preferredTime()!=null&&!request.preferredTime().isBlank()&&!Set.of("10:00 AM - 1:00 PM","1:00 PM - 4:00 PM","4:00 PM - 7:00 PM").contains(request.preferredTime()))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Preferred time slot is invalid");if(idempotencyKey!=null&&!idempotencyKey.isBlank()){try{return pickup(jdbc.queryForObject("select id from pickup_requests where seller_id=? and idempotency_key=?",UUID.class,u.id(),idempotencyKey));}catch(Exception ignored){}} UUID id=UUID.randomUUID(); BigDecimal total=BigDecimal.ZERO; jdbc.update("insert into pickup_requests(id,seller_id,pickup_address,preferred_date,preferred_time,seller_notes,estimated_amount,idempotency_key) values(?,?,cast(? as jsonb),cast(? as date),?,?,0,?)",id,u.id(),json(request.address()),request.preferredDate(),request.preferredTime(),request.sellerNotes(),idempotencyKey); for(Item item:request.items()){if(item.estimatedQuantity().compareTo(new BigDecimal("10000000"))>0)throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Quantity is too large");BigDecimal rate=rateFor(item.categoryId(),u.role()); total=total.add(rate.multiply(item.estimatedQuantity())); jdbc.update("insert into pickup_items(pickup_id,category_id,estimated_quantity,saved_rate,category_name_snapshot,rate_type_snapshot) select ?,id,?,?,name,? from scrap_categories where id=? and is_active=true",id,item.estimatedQuantity(),rate,u.role(),item.categoryId());} jdbc.update("update pickup_requests set estimated_amount=? where id=?",total,id); recordStatus(id,"SUBMITTED",u.id(),null); jdbc.update("insert into notifications(recipient_id,notification_type,title,message,related_entity_type,related_entity_id) select id,'NEW_PICKUP_REQUEST','New pickup request','A seller submitted a new pickup request.','PICKUP',? from profiles where account_type='ADMIN' and account_status='ACTIVE'",id); Map<String,Object> result=pickup(id); safeSend("SELLER_PICKUP_SUBMITTED", String.valueOf(result.get("seller_email")), Map.of("fullName",String.valueOf(result.get("seller_name")),"pickupId",String.valueOf(id),"preferredDate",request.preferredDate(),"preferredTime",request.preferredTime()==null?"":request.preferredTime(),"estimatedAmount",String.valueOf(total))); return result; }

    @GetMapping("/pickups") public List<Map<String,Object>> pickups() { var u=users.current(); if("ADMIN".equals(u.role())) return jdbc.queryForList("select p.*,(select coalesce(sum(i.estimated_quantity),0) from pickup_items i where i.pickup_id=p.id) estimated_weight,s.full_name seller_name,s.email seller_email,s.account_type seller_type from pickup_requests p join profiles s on s.id=p.seller_id order by p.created_at desc"); if("STAFF".equals(u.role())) return jdbc.queryForList("select p.*,(select coalesce(sum(i.estimated_quantity),0) from pickup_items i where i.pickup_id=p.id) estimated_weight,s.full_name seller_name,s.email seller_email,s.account_type seller_type from pickup_requests p join profiles s on s.id=p.seller_id where p.assigned_staff_id=? order by p.created_at desc",u.id()); return jdbc.queryForList("select * from pickup_requests where seller_id=? order by created_at desc",u.id()); }
    @GetMapping("/pickups/{id}") public Map<String,Object> pickupDetail(@PathVariable UUID id) { var u=users.current(); Map<String,Object> p=pickup(id); if(!"ADMIN".equals(u.role())&&!u.id().equals(p.get("seller_id"))&&!u.id().equals(p.get("assigned_staff_id"))) throw new ResponseStatusException(HttpStatus.FORBIDDEN,"Pickup access denied"); return p; }
    @PostMapping(value="/pickups/{id}/photos", consumes="multipart/form-data") @Transactional
    public List<Map<String,Object>> uploadPhotos(@PathVariable UUID id, @RequestPart("files") List<MultipartFile> files) {
        var u=users.require("HOME_SELLER","BULK_SELLER"); Map<String,Object> p=pickup(id);
        if(!u.id().equals(p.get("seller_id"))) throw new ResponseStatusException(HttpStatus.FORBIDDEN,"Pickup access denied");
        if(files==null||files.isEmpty()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Select at least one photo");
        Integer existing=jdbc.queryForObject("select count(*) from pickup_photos where pickup_id=?",Integer.class,id);
        if(existing!=null&&existing+files.size()>5) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"A maximum of 5 pickup photos is allowed");
        Path folder=Path.of("uploads","pickups",id.toString()); try{Files.createDirectories(folder);}catch(Exception e){throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,"Photo storage is not available");}
        List<Map<String,Object>> saved=new ArrayList<>();
        UUID sellerId=(UUID)p.get("seller_id");
        for(MultipartFile file:files){String type=file.getContentType()==null?"":file.getContentType().toLowerCase(Locale.ROOT);if(!Set.of("image/jpeg","image/png","image/webp").contains(type))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Only JPG, PNG, and WEBP photos are allowed");if(file.isEmpty()||file.getSize()>10*1024*1024)throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Each photo must be smaller than 10 MB");String extension=type.equals("image/png")?".png":type.equals("image/webp")?".webp":".jpg";String storage=UUID.randomUUID()+extension;try{file.transferTo(folder.resolve(storage));}catch(Exception e){throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,"Photo could not be stored");}UUID photoId=UUID.randomUUID();jdbc.update("insert into pickup_photos(id,pickup_id,seller_id,storage_name,original_name,content_type,size_bytes) values(?,?,?,?,?,?,?)",photoId,id,sellerId,id+"/"+storage,file.getOriginalFilename()==null?storage:file.getOriginalFilename(),type,file.getSize());saved.add(Map.of("id",photoId,"url","/uploads/pickups/"+id+"/"+storage,"name",file.getOriginalFilename()==null?storage:file.getOriginalFilename()));}
        return saved;
    }
    @PostMapping("/pickups/{id}/cancel") public Map<String,Object> cancel(@PathVariable UUID id) { var u=users.require("HOME_SELLER","BULK_SELLER"); Map<String,Object> p=pickup(id); if(!u.id().equals(p.get("seller_id"))) throw new ResponseStatusException(HttpStatus.FORBIDDEN,"Pickup access denied"); changeStatus(id,"CANCELLED",u.id(),"Cancelled by seller"); return pickup(id); }
    @PostMapping("/admin/pickups/{id}/status") public Map<String,Object> adminStatus(@PathVariable UUID id,@Valid @RequestBody StatusRequest request){var u=users.require("ADMIN");changeStatus(id,request.status(),u.id(),request.reason());return pickup(id);}
   @PostMapping("/admin/pickups/{id}/assign-legacy") public Map<String,Object> assign(@PathVariable UUID id,@Valid @RequestBody AssignRequest request){var u=users.require("ADMIN");Integer n=jdbc.queryForObject("select count(*) from profiles where id=? and account_type='STAFF' and account_status='ACTIVE' and availability_status <> 'UNAVAILABLE'",Integer.class,request.staffId());if(n==null||n==0)throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Available active Staff account required");Map<String,Object> existing=pickup(id);UUID previous=(UUID) existing.get("assigned_staff_id");if(request.staffId().equals(previous)) return existing;jdbc.update("update pickup_requests set assigned_staff_id=?,status='ASSIGNED',updated_at=now() where id=?",request.staffId(),id);jdbc.update("insert into staff_assignment_history(pickup_id,previous_staff_id,assigned_staff_id,changed_by,reason) values(?,?,?,?,?)",id,previous,request.staffId(),u.id(),previous==null?"Initial assignment":"Reassignment");recordStatus(id,"ASSIGNED",u.id(),previous==null?null:"Reassigned Staff");notifyUser(request.staffId(),"PICKUP_ASSIGNED","New pickup assigned","A pickup request has been assigned to you.",id);return pickup(id);}
    @PostMapping("/staff/pickups/{id}/collect") public Map<String,Object> collect(@PathVariable UUID id,@Valid @RequestBody CollectionRequest request){var u=users.require("STAFF");Map<String,Object> p=pickup(id);if(!u.id().equals(p.get("assigned_staff_id")))throw new ResponseStatusException(HttpStatus.FORBIDDEN,"Pickup is not assigned to you");jdbc.update("update pickup_requests set actual_weight=?,actual_amount=(select coalesce(sum(? * saved_rate),0) from pickup_items where pickup_id=?),collection_notes=?,updated_at=now() where id=?",request.actualWeight(),request.actualWeight(),id,request.notes(),id);changeStatus(id,"COLLECTED",u.id(),request.notes());return pickup(id);}
    @PostMapping("/staff/pickups/{id}/status") public Map<String,Object> staffStatus(@PathVariable UUID id,@Valid @RequestBody StatusRequest request){var u=users.require("STAFF");Map<String,Object> p=pickup(id);if(!u.id().equals(p.get("assigned_staff_id")))throw new ResponseStatusException(HttpStatus.FORBIDDEN,"Pickup is not assigned to you");if(!Set.of("ON_THE_WAY","ASSIGNED").contains(request.status()))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Staff cannot set this status");changeStatus(id,request.status(),u.id(),request.reason());return pickup(id);}
    @PostMapping("/staff/pickups/{id}/unable") public Map<String,Object> unable(@PathVariable UUID id,@Valid @RequestBody StatusRequest request){var u=users.require("STAFF");Map<String,Object> p=pickup(id);if(!u.id().equals(p.get("assigned_staff_id")))throw new ResponseStatusException(HttpStatus.FORBIDDEN,"Pickup is not assigned to you");changeStatus(id,"UNABLE_TO_COLLECT",u.id(),request.reason());return pickup(id);}

    private BigDecimal rateFor(UUID category,String role){String column="HOME_SELLER".equals(role)?"home_seller_rate":"bulk_seller_rate";try{return jdbc.queryForObject("select r."+column+" from scrap_rates r join scrap_categories c on c.id=r.category_id where r.category_id=? and c.is_active=true and r.effective_from <= now() order by r.effective_from desc limit 1",BigDecimal.class,category);}catch(Exception e){throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"No active rate exists for this scrap category");}}
    private Map<String,Object> pickup(UUID id){try{return jdbc.queryForMap("select p.*,s.full_name seller_name,s.email seller_email from pickup_requests p join profiles s on s.id=p.seller_id where p.id=?",id);}catch(Exception e){throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Pickup not found");}}
    private void changeStatus(UUID id,String status,UUID actor,String reason){Set<String> allowed=Set.of("SUBMITTED","CONFIRMED","SCHEDULED","ASSIGNED","ON_THE_WAY","COLLECTED","COMPLETED","REJECTED","CANCELLED","UNABLE_TO_COLLECT");if(!allowed.contains(status))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Invalid pickup status");Map<String,Object> current=pickup(id);String old=String.valueOf(current.get("status"));if("REJECTED".equals(status)||"CANCELLED".equals(status)||"UNABLE_TO_COLLECT".equals(status)){if(reason==null||reason.isBlank())throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"A reason is required for this status");}if("COMPLETED".equals(status)&&!"COLLECTED".equals(old))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Pickup must be collected before completion");if("COMPLETED".equals(status)&&current.get("actual_weight")==null)throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Actual weight is required before completion");if("COMPLETED".equals(status))jdbc.update("update pickup_requests set completed_at=now() where id=?",id);jdbc.update("update pickup_requests set status=?,rejection_reason=?,cancelled_reason=case when ?='CANCELLED' then ? else cancelled_reason end,updated_at=now() where id=?",status,reason,status,reason,id);recordStatus(id,status,actor,reason);UUID sellerId=(UUID)current.get("seller_id");if(sellerId!=null&&!sellerId.equals(actor)){String message="Your pickup is now " + status.replace('_',' ') + ".";notifyUser(sellerId,"PICKUP_STATUS_UPDATED","Pickup status updated",message,id);safeSend("SELLER_PICKUP_STATUS_UPDATE",String.valueOf(current.get("seller_email")),Map.of("fullName",String.valueOf(current.get("seller_name")),"pickupId",String.valueOf(id),"status",status.replace('_',' '),"message",reason==null?message:reason,"pickupUrl","/seller/requests/"+id));}}
    private void recordStatus(UUID id,String status,UUID actor,String reason){jdbc.update("insert into pickup_status_history(pickup_id,status,changed_by,reason) values(?,?,?,?)",id,status,actor,reason);}
    private void notifyUser(UUID recipient,String type,String title,String message,UUID entityId){jdbc.update("insert into notifications(recipient_id,notification_type,title,message,related_entity_type,related_entity_id) values(?,?,?,?,?,?)",recipient,type,title,message,"PICKUP",entityId);}
    private void safeSend(String template,String recipient,Map<String,?> variables){try{if(recipient!=null&&!recipient.isBlank())emailService.send(template,recipient,variables);}catch(Exception exception){log.error("Email notification failed for template={} recipient={}",template,recipient,exception);}}
    private String json(Object value){try{return mapper.writeValueAsString(value);}catch(Exception e){throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Invalid pickup address");}}
    private String hash(String value){try{return Base64.getEncoder().encodeToString(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)));}catch(Exception e){throw new IllegalStateException(e);}}

    public record CategoryRequest(@NotBlank String name, String description, Boolean isActive){}
    public record RateRequest(@NotNull UUID categoryId,@NotNull BigDecimal homeSellerRate,@NotNull BigDecimal bulkSellerRate){}
    public record StaffUpdateRequest(@NotBlank String fullName, String phone, String serviceArea, @NotBlank String accountStatus){}
    public record InviteRequest(@NotBlank String email,String fullName,String mobileNumber,String serviceArea,String setupMode,String temporaryPassword){}
    public record AssignRequest(@NotNull UUID staffId){}
    public record StatusRequest(@NotBlank String status,String reason){}
    public record CollectionRequest(@NotNull @Positive BigDecimal actualWeight,String notes){}
    public record PickupRequest(@NotNull Object address,@NotBlank String preferredDate,String preferredTime,String sellerNotes,@NotEmpty List<Item> items){}
    public record Item(@NotNull UUID categoryId,@NotNull @Positive BigDecimal estimatedQuantity){}
}
