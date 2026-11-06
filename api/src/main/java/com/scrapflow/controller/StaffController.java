package com.scrapflow.controller;

import com.scrapflow.auth.SessionUserService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.*;

@RestController
@RequestMapping("/api/staff")
public class StaffController {
    private final JdbcTemplate jdbc;
    private final SessionUserService users;

    public StaffController(JdbcTemplate jdbc, SessionUserService users) { this.jdbc = jdbc; this.users = users; }

    @GetMapping("/me")
    public Map<String, Object> me() {
        var user = users.require("STAFF");
        return jdbc.queryForMap("select id,full_name,email,phone,service_area,account_status,availability_status,created_at from profiles where id=?", user.id());
    }

    @GetMapping("/pickups")
    public List<Map<String, Object>> pickups(@RequestParam(defaultValue = "") String search,
                                             @RequestParam(defaultValue = "") String status,
                                             @RequestParam(defaultValue = "") String date) {
        var user = users.require("STAFF");
        StringBuilder sql = new StringBuilder("select p.id,p.status,p.pickup_address,p.preferred_date,p.preferred_time,p.estimated_amount,p.actual_amount,p.seller_notes,p.photo_url,s.full_name seller_name,s.email seller_email,s.phone seller_phone,s.account_type seller_type from pickup_requests p join profiles s on s.id=p.seller_id where p.assigned_staff_id=?");
        List<Object> args = new ArrayList<>(List.of(user.id()));
        if (!search.isBlank()) { sql.append(" and (s.full_name ilike ? or cast(p.pickup_address as text) ilike ? or s.email ilike ?)"); String q="%"+search.trim()+"%"; args.add(q);args.add(q);args.add(q); }
        if (!status.isBlank()) { sql.append(" and p.status=?"); args.add(status); }
        if (!date.isBlank()) { sql.append(" and p.preferred_date=cast(? as date)"); args.add(date); }
        sql.append(" order by p.preferred_date asc,p.created_at desc");
        return jdbc.queryForList(sql.toString(), args.toArray());
    }

    @GetMapping("/pickups/{id}")
    public Map<String, Object> detail(@PathVariable UUID id) {
        var user = users.require("STAFF");
        Map<String, Object> pickup = ownedPickup(id, user.id());
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("pickup", pickup);
        result.put("items", jdbc.queryForList("select i.id,i.estimated_quantity,i.actual_weight,i.saved_rate,case when i.actual_weight is null then null else round(i.actual_weight*i.saved_rate,2) end final_amount,coalesce(i.category_name_snapshot,c.name) category_name from pickup_items i join scrap_categories c on c.id=i.category_id where i.pickup_id=? order by c.name", id));
        result.put("payments", jdbc.queryForList("select id,amount,payment_method,payment_reference,payment_notes,payment_status,recorded_by,created_at from pickup_payment_records where pickup_id=? order by created_at asc", id));
        result.put("photos", jdbc.queryForList("select id,concat('/uploads/pickups/',storage_name) url,original_name name,content_type,created_at from pickup_photos where pickup_id=? order by created_at asc", id));
        result.put("history", jdbc.queryForList("select h.status,h.reason,h.created_at,p.full_name changed_by from pickup_status_history h join profiles p on p.id=h.changed_by where h.pickup_id=? order by h.created_at asc", id));
        return result;
    }

    @PostMapping("/pickups/{id}/start")
    public Map<String, Object> start(@PathVariable UUID id) {
        var user = users.require("STAFF");
        Map<String, Object> pickup = ownedPickup(id, user.id());
        requireStatus(pickup, Set.of("ASSIGNED"));
        updateStatus(id, "ON_THE_WAY", user.id(), null);
        return detail(id);
    }

    @Transactional
    @PostMapping("/pickups/{id}/complete")
    public Map<String, Object> complete(@PathVariable UUID id, @Valid @RequestBody CompleteRequest request) {
        var user = users.require("STAFF");
        Map<String, Object> pickup = ownedPickup(id, user.id());
        requireStatus(pickup, Set.of("ASSIGNED", "ON_THE_WAY"));
        if (!request.confirmed() || request.weights() == null || request.weights().isEmpty()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Confirm the collected items and enter actual weight for every item");
        Map<String, Object> locked = jdbc.queryForMap("select status from pickup_requests where id=? and assigned_staff_id=? for update", id, user.id());
        requireStatus(locked, Set.of("ASSIGNED", "ON_THE_WAY"));
        Integer itemCount = jdbc.queryForObject("select count(*) from pickup_items where pickup_id=?", Integer.class, id);
        if (itemCount == null || request.weights().size() != itemCount || request.weights().stream().map(WeightInput::itemId).distinct().count() != request.weights().size()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Enter one actual weight for every pickup item");
        BigDecimal totalWeight = BigDecimal.ZERO;
        BigDecimal totalAmount = BigDecimal.ZERO;
        for (WeightInput weight : request.weights()) {
            if (weight.itemId() == null || weight.actualWeight() == null || weight.actualWeight().signum() < 0) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Actual weight must be zero or greater for every item");
            Integer exists = jdbc.queryForObject("select count(*) from pickup_items where id=? and pickup_id=?", Integer.class, weight.itemId(), id);
            if (exists == null || exists == 0) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid pickup item");
            jdbc.update("update pickup_items set actual_weight=? where id=? and pickup_id=?", weight.actualWeight(), weight.itemId(), id);
            BigDecimal rate = jdbc.queryForObject("select saved_rate from pickup_items where id=? and pickup_id=?", BigDecimal.class, weight.itemId(), id);
            totalWeight = totalWeight.add(weight.actualWeight()); totalAmount = totalAmount.add(weight.actualWeight().multiply(rate));
        }
        Integer missing = jdbc.queryForObject("select count(*) from pickup_items where pickup_id=? and actual_weight is null", Integer.class, id);
        if (missing != null && missing > 0) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Enter actual weight for every requested category");
        List<PaymentInput> payments = request.payments();
        if ((payments == null || payments.isEmpty()) && request.amountPaid() != null && request.amountPaid().signum() > 0) payments = List.of(new PaymentInput(request.amountPaid(), request.paymentMethod(), request.paymentReference(), request.paymentNotes()));
        if (payments == null) payments = List.of();
        BigDecimal amountPaid = payments.stream().map(p -> p == null || p.amount() == null ? BigDecimal.ZERO : p.amount()).reduce(BigDecimal.ZERO, BigDecimal::add);
        validatePayments(payments, totalAmount);
        if (amountPaid.compareTo(totalAmount) > 0) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Amount paid cannot exceed the final amount");
        String paymentStatus = amountPaid.signum() == 0 ? "UNPAID" : amountPaid.compareTo(totalAmount) == 0 ? "PAID" : "PARTIALLY_PAID";
        BigDecimal balance = totalAmount.subtract(amountPaid);
        jdbc.update("update pickup_requests set actual_weight=?,actual_amount=?,amount_paid=?,payment_balance=?,payment_method=?,payment_status=?,payment_reference=?,payment_notes=?,collection_notes=?,collected_at=now(),collected_by=?,updated_at=now() where id=? and status in ('ASSIGNED','ON_THE_WAY')", totalWeight, totalAmount, amountPaid, balance, payments.isEmpty() ? null : payments.get(payments.size()-1).paymentMethod(), payments.isEmpty() ? "UNPAID" : paymentStatus, payments.isEmpty() ? null : payments.get(payments.size()-1).reference(), payments.isEmpty() ? null : payments.get(payments.size()-1).notes(), request.notes(), user.id(), id);
        for (int i = 0; i < payments.size(); i++) { PaymentInput payment = payments.get(i); jdbc.update("insert into pickup_payment_records(pickup_id,amount,payment_method,payment_reference,payment_notes,payment_status,recorded_by,idempotency_key) values(?,?,?,?,?,?,?,?)", id, payment.amount(), payment.paymentMethod(), payment.reference(), payment.notes(), paymentStatus, user.id(), request.idempotencyKey() == null ? null : request.idempotencyKey()+"-"+i); }
        updateStatus(id, "COLLECTED", user.id(), request.notes());
        jdbc.update("insert into notifications(recipient_id,notification_type,title,message,related_entity_type,related_entity_id) select seller_id,'PICKUP_COLLECTED','Pickup collected','Your pickup collection and payment details are now available.','PICKUP',id from pickup_requests where id=?", id);
        return detail(id);
    }

    @Transactional
    @PostMapping("/pickups/{id}/payments")
    public Map<String, Object> addPayments(@PathVariable UUID id, @Valid @RequestBody PaymentRequest request) {
        var user = users.require("STAFF");
        Map<String, Object> pickup = ownedPickup(id, user.id());
        requireStatus(pickup, Set.of("COLLECTED"));
        jdbc.queryForMap("select status from pickup_requests where id=? and assigned_staff_id=? for update", id, user.id());
        if (request.payments() == null || request.payments().isEmpty()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Add at least one payment");
        if (request.idempotencyKey() != null && !request.idempotencyKey().isBlank()) {
            Integer exists = jdbc.queryForObject("select count(*) from pickup_payment_records where pickup_id=? and idempotency_key like ?", Integer.class, id, request.idempotencyKey() + "-%");
            if (exists != null && exists > 0) return detail(id);
        }
        BigDecimal finalAmount = (BigDecimal) pickup.get("actual_amount");
        BigDecimal alreadyPaid = pickup.get("amount_paid") == null ? BigDecimal.ZERO : (BigDecimal) pickup.get("amount_paid");
        BigDecimal additional = request.payments().stream().map(p -> p == null || p.amount() == null ? BigDecimal.ZERO : p.amount()).reduce(BigDecimal.ZERO, BigDecimal::add);
        validatePayments(request.payments(), finalAmount.subtract(alreadyPaid));
        if (alreadyPaid.add(additional).compareTo(finalAmount) > 0) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payment exceeds remaining balance");
        BigDecimal paid = alreadyPaid.add(additional); String status = paid.signum() == 0 ? "UNPAID" : paid.compareTo(finalAmount) == 0 ? "PAID" : "PARTIALLY_PAID";
        BigDecimal balance = finalAmount.subtract(paid);
        jdbc.update("update pickup_requests set amount_paid=?,payment_balance=?,payment_method=?,payment_status=?,payment_reference=?,payment_notes=?,updated_at=now() where id=? and status='COLLECTED'", paid, balance, request.payments().get(request.payments().size()-1).paymentMethod(), status, request.payments().get(request.payments().size()-1).reference(), request.payments().get(request.payments().size()-1).notes(), id);
        for (int i=0;i<request.payments().size();i++) { PaymentInput payment=request.payments().get(i); jdbc.update("insert into pickup_payment_records(pickup_id,amount,payment_method,payment_reference,payment_notes,payment_status,recorded_by,idempotency_key) values(?,?,?,?,?,?,?,?)",id,payment.amount(),payment.paymentMethod(),payment.reference(),payment.notes(),status,user.id(),request.idempotencyKey()==null?null:request.idempotencyKey()+"-"+i); }
        return detail(id);
    }

    @PostMapping("/pickups/{id}/unable-to-collect")
    public Map<String, Object> unable(@PathVariable UUID id, @Valid @RequestBody ReasonRequest request) {
        var user = users.require("STAFF");
        Map<String, Object> pickup = ownedPickup(id, user.id());
        requireStatus(pickup, Set.of("ASSIGNED", "ON_THE_WAY"));
        updateStatus(id, "UNABLE_TO_COLLECT", user.id(), request.reason());
        return detail(id);
    }

    @GetMapping("/history")
    public List<Map<String, Object>> history() {
        var user = users.require("STAFF");
        return jdbc.queryForList("select p.id,p.status,p.preferred_date,p.preferred_time,p.actual_weight,p.actual_amount,p.collection_notes,s.full_name seller_name,s.account_type seller_type from pickup_requests p join profiles s on s.id=p.seller_id where p.assigned_staff_id=? and p.status in ('COLLECTED','COMPLETED','UNABLE_TO_COLLECT') order by p.updated_at desc", user.id());
    }

    @GetMapping("/notifications")
    public List<Map<String, Object>> notifications() {
        var user = users.require("STAFF");
        return jdbc.queryForList("select id,notification_type,title,message,related_entity_type,related_entity_id,is_read,created_at,read_at from notifications where recipient_id=? order by created_at desc", user.id());
    }

    @PatchMapping("/notifications/{id}/read")
    public Map<String, Object> markNotificationRead(@PathVariable UUID id) {
        var user = users.require("STAFF");
        int updated = jdbc.update("update notifications set is_read=true,read_at=now() where id=? and recipient_id=?", id, user.id());
        if (updated == 0) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found");
        return Map.of("id", id, "isRead", true);
    }

    private Map<String, Object> ownedPickup(UUID id, UUID staffId) {
        try { return jdbc.queryForMap("select p.*,s.full_name seller_name,s.email seller_email,s.phone seller_phone,s.account_type seller_type from pickup_requests p join profiles s on s.id=p.seller_id where p.id=? and p.assigned_staff_id=?", id, staffId); }
        catch (Exception e) { throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Pickup is not assigned to this Staff account"); }
    }
    private void requireStatus(Map<String, Object> pickup, Set<String> allowed) { if (!allowed.contains(String.valueOf(pickup.get("status")))) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This action is not valid for the current pickup status"); }
    private void validatePayments(List<PaymentInput> payments, BigDecimal remaining) { for (PaymentInput payment : payments) { if (payment == null || payment.amount() == null || payment.amount().signum() <= 0) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payment amounts must be greater than zero"); if (payment.paymentMethod() == null || !Set.of("CASH", "UPI", "BANK_TRANSFER").contains(payment.paymentMethod())) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Select Cash, UPI, or Bank Transfer for every payment"); } BigDecimal total=payments.stream().map(PaymentInput::amount).reduce(BigDecimal.ZERO,BigDecimal::add); if(total.compareTo(remaining)>0) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Payment exceeds remaining balance"); }
    private void updateStatus(UUID id, String status, UUID actor, String reason) { jdbc.update("update pickup_requests set status=?,collection_notes=coalesce(?,collection_notes),updated_at=now() where id=?", status, reason, id); jdbc.update("insert into pickup_status_history(pickup_id,status,changed_by,reason) values(?,?,?,?)", id, status, actor, reason); }

    public record ReasonRequest(@NotBlank String reason) {}
    public record WeightInput(@NotNull UUID itemId, @NotNull @PositiveOrZero BigDecimal actualWeight) {}
    public record PaymentInput(BigDecimal amount, String paymentMethod, String reference, String notes) {}
    public record CompleteRequest(List<WeightInput> weights, String notes, boolean confirmed, BigDecimal amountPaid, String paymentMethod, String paymentReference, String paymentNotes, List<PaymentInput> payments, String idempotencyKey) {}
    public record PaymentRequest(List<PaymentInput> payments, String idempotencyKey) {}
}
