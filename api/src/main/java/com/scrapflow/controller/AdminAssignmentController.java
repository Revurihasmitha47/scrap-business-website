package com.scrapflow.controller;

import com.scrapflow.auth.SessionUserService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;

@RestController
@RequestMapping("/api/admin/pickups")
public class AdminAssignmentController {
    private final JdbcTemplate jdbc;
    private final SessionUserService users;

    public AdminAssignmentController(JdbcTemplate jdbc, SessionUserService users) { this.jdbc = jdbc; this.users = users; }

    @GetMapping("/{id}/assignable-staff")
    public List<Map<String,Object>> assignableStaff(@PathVariable UUID id,
                                                     @RequestParam(defaultValue = "") String search,
                                                     @RequestParam(defaultValue = "") String availability,
                                                     @RequestParam(defaultValue = "") String serviceArea) {
        users.require("ADMIN");
        Map<String,Object> request = pickup(id);
        StringBuilder sql = new StringBuilder("select p.id,p.full_name,p.email,p.phone,p.service_area,p.account_status,p.availability_status," +
            "(select count(*) from pickup_requests x where x.assigned_staff_id=p.id and x.status not in ('COMPLETED','CANCELLED','REJECTED')) assigned_pickups " +
            "from profiles p where p.account_type='STAFF'");
        List<Object> args = new ArrayList<>();
        if (!search.isBlank()) { sql.append(" and (p.full_name ilike ? or p.phone ilike ?)"); String q = "%" + search.trim() + "%"; args.add(q); args.add(q); }
        if (!availability.isBlank()) { sql.append(" and p.availability_status=?"); args.add(availability); }
        if (!serviceArea.isBlank()) { sql.append(" and p.service_area ilike ?"); args.add("%" + serviceArea.trim() + "%"); }
        sql.append(" order by p.full_name");
        String status = String.valueOf(request.get("status"));
        UUID assigned = (UUID) request.get("assigned_staff_id");
        boolean assignableStatus = Set.of("SUBMITTED", "CONFIRMED", "SCHEDULED").contains(status);
        List<Map<String,Object>> rows = jdbc.queryForList(sql.toString(), args.toArray());
        rows.forEach(row -> {
            boolean active = "ACTIVE".equals(String.valueOf(row.get("account_status")));
            boolean available = "AVAILABLE".equals(String.valueOf(row.get("availability_status")));
            boolean current = assigned != null && assigned.equals(row.get("id"));
            row.put("currently_assigned", current);
            row.put("can_assign", assignableStatus && active && available && !current);
            row.put("unavailable_reason", !assignableStatus ? "Request must be Confirmed or Scheduled." : !active ? "Staff account is inactive." : !available ? "Staff is not currently available." : current ? "Already assigned to this pickup." : null);
        });
        return rows;
    }

    @GetMapping("/{id}/assignment-context")
    public Map<String,Object> assignmentContext(@PathVariable UUID id) {
        users.require("ADMIN");
        Map<String,Object> result = new LinkedHashMap<>();
        result.put("pickup", pickup(id));
        result.put("items", jdbc.queryForList("select i.id,coalesce(i.category_name_snapshot,c.name) category_name,i.estimated_quantity,i.saved_rate from pickup_items i join scrap_categories c on c.id=i.category_id where i.pickup_id=? order by c.name", id));
        return result;
    }

    @GetMapping("/{id}/assignment-history")
    public List<Map<String,Object>> assignmentHistory(@PathVariable UUID id) {
        users.require("ADMIN");
        pickup(id);
        return jdbc.queryForList("select h.id,h.previous_staff_id,h.assigned_staff_id,h.reason,h.created_at,old.full_name previous_staff_name,new.full_name assigned_staff_name,actor.full_name changed_by_name from staff_assignment_history h left join profiles old on old.id=h.previous_staff_id join profiles new on new.id=h.assigned_staff_id join profiles actor on actor.id=h.changed_by where h.pickup_id=? order by h.created_at desc", id);
    }

    @PostMapping("/{id}/assign")
    @Transactional
    public Map<String,Object> assign(@PathVariable UUID id, @Valid @RequestBody AssignRequest request) {
        var admin = users.require("ADMIN");
        Map<String,Object> existing = pickup(id);
        String status = String.valueOf(existing.get("status"));
        if (!Set.of("SUBMITTED", "CONFIRMED", "SCHEDULED").contains(status)) throw new ResponseStatusException(HttpStatus.CONFLICT, "This pickup cannot be assigned in its current status.");
        UUID previous = (UUID) existing.get("assigned_staff_id");
        if (previous != null && (request.reason() == null || request.reason().isBlank())) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A reassignment reason is required.");
        if (previous != null && previous.equals(request.staffId())) throw new ResponseStatusException(HttpStatus.CONFLICT, "This Staff member is already assigned to the pickup.");
        Integer eligible = jdbc.queryForObject("select count(*) from profiles where id=? and account_type='STAFF' and account_status='ACTIVE' and availability_status='AVAILABLE'", Integer.class, request.staffId());
        if (eligible == null || eligible == 0) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selected Staff is inactive or unavailable.");
        int updated = jdbc.update("update pickup_requests set assigned_staff_id=?,status='ASSIGNED',updated_at=now() where id=? and status in ('SUBMITTED','CONFIRMED','SCHEDULED')", request.staffId(), id);
        if (updated != 1) throw new ResponseStatusException(HttpStatus.CONFLICT, "Pickup was changed by another Admin. Refresh and try again.");
        String reason = request.reason() == null || request.reason().isBlank() ? request.note() : request.reason();
        jdbc.update("insert into staff_assignment_history(pickup_id,previous_staff_id,assigned_staff_id,changed_by,reason) values(?,?,?,?,?)", id, previous, request.staffId(), admin.id(), reason);
        recordStatus(id, "ASSIGNED", admin.id(), reason);
        if (previous != null) notifyUser(previous, "PICKUP_REASSIGNED", "Pickup reassigned", "This pickup was reassigned to another Staff member.", id);
        notifyUser(request.staffId(), "PICKUP_ASSIGNED", "New pickup assigned", "A pickup request has been assigned to you.", id);
        UUID sellerId = (UUID) existing.get("seller_id");
        if (sellerId != null) notifyUser(sellerId, "PICKUP_STATUS_UPDATED", "Pickup assigned", "A Staff member has been assigned to your pickup.", id);
        return pickup(id);
    }

    private Map<String,Object> pickup(UUID id) { try { return jdbc.queryForMap("select p.*,s.full_name seller_name,s.email seller_email,s.phone seller_phone,s.account_type seller_type from pickup_requests p join profiles s on s.id=p.seller_id where p.id=?", id); } catch (Exception e) { throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Pickup request not found"); } }
    private void recordStatus(UUID id, String status, UUID actor, String reason) { jdbc.update("insert into pickup_status_history(pickup_id,status,changed_by,reason) values(?,?,?,?)", id, status, actor, reason); }
    private void notifyUser(UUID recipient, String type, String title, String message, UUID entityId) { jdbc.update("insert into notifications(recipient_id,notification_type,title,message,related_entity_type,related_entity_id) values(?,?,?,?,?,?)", recipient, type, title, message, "PICKUP", entityId); }
    public record AssignRequest(@NotNull UUID staffId, String note, String reason) {}
}
