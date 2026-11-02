package com.scrapflow.controller;

import com.scrapflow.auth.SessionUserService;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/** Read-only Admin operations endpoints. All counts and list totals come from PostgreSQL. */
@RestController
@RequestMapping("/api/admin")
public class AdminOperationsController {
    private final JdbcTemplate jdbc;
    private final SessionUserService users;

    public AdminOperationsController(JdbcTemplate jdbc, SessionUserService users) {
        this.jdbc = jdbc;
        this.users = users;
    }

    @GetMapping("/dashboard")
    public Map<String, Object> dashboard() {
        users.require("ADMIN");
        return Map.of(
            "newRequests", count("select count(*) from pickup_requests where status='SUBMITTED'"),
            "confirmedPickups", count("select count(*) from pickup_requests where status in ('CONFIRMED','SCHEDULED')"),
            "inProgressPickups", count("select count(*) from pickup_requests where status in ('ASSIGNED','ON_THE_WAY','COLLECTED')"),
            "completedPickups", count("select count(*) from pickup_requests where status='COMPLETED'"),
            "activeStaff", count("select count(*) from profiles where account_type='STAFF' and account_status='ACTIVE'"),
            "homeSellers", count("select count(*) from profiles where account_type='HOME_SELLER'"),
            "bulkSellers", count("select count(*) from profiles where account_type='BULK_SELLER'"),
            "recentRequests", jdbc.queryForList("select p.id,p.status,p.preferred_date,p.preferred_time,p.estimated_amount,s.full_name seller_name,s.account_type seller_type from pickup_requests p join profiles s on s.id=p.seller_id order by p.created_at desc limit 6"),
            "staffOverview", jdbc.queryForList("select id,full_name,account_status,availability_status from profiles where account_type='STAFF' order by full_name limit 8"),
            "rateOverview", jdbc.queryForList("select c.id,c.name,r.home_seller_rate,r.bulk_seller_rate,r.effective_from from scrap_categories c left join lateral (select home_seller_rate,bulk_seller_rate,effective_from from scrap_rates where category_id=c.id and effective_from <= now() order by effective_from desc limit 1) r on true where c.is_active=true order by c.name")
        );
    }

    @GetMapping("/pickups")
    public PageResponse<Map<String, Object>> pickups(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "25") int size,
        @RequestParam(defaultValue = "") String search,
        @RequestParam(defaultValue = "") String status,
        @RequestParam(defaultValue = "") String sellerType,
        @RequestParam(defaultValue = "") String fromDate,
        @RequestParam(defaultValue = "") String toDate,
        @RequestParam(defaultValue = "created_at") String sort,
        @RequestParam(defaultValue = "desc") String direction
    ) {
        users.require("ADMIN");
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 100);
        String sortColumn = switch (sort) {
            case "preferred_date" -> "p.preferred_date";
            case "status" -> "p.status";
            case "seller_name" -> "s.full_name";
            default -> "p.created_at";
        };
        String sortDirection = "asc".equalsIgnoreCase(direction) ? "asc" : "desc";
        StringBuilder where = new StringBuilder(" from pickup_requests p join profiles s on s.id=p.seller_id where 1=1");
        java.util.ArrayList<Object> args = new java.util.ArrayList<>();
        if (!search.isBlank()) { where.append(" and (cast(p.id as text) ilike ? or s.full_name ilike ? or s.email ilike ? or cast(p.pickup_address as text) ilike ?)"); String q="%"+search.trim()+"%"; args.add(q);args.add(q);args.add(q);args.add(q); }
        if (!status.isBlank()) { where.append(" and p.status=?"); args.add(status); }
        if (!sellerType.isBlank()) { where.append(" and s.account_type=?"); args.add(sellerType); }
        if (!fromDate.isBlank()) { where.append(" and p.preferred_date >= cast(? as date)"); args.add(fromDate); }
        if (!toDate.isBlank()) { where.append(" and p.preferred_date <= cast(? as date)"); args.add(toDate); }
        long total = jdbc.queryForObject("select count(*)" + where, Long.class, args.toArray());
        args.add(safeSize); args.add(safePage * safeSize);
        List<Map<String,Object>> items = jdbc.queryForList("select p.id,p.status,p.pickup_address,p.preferred_date,p.preferred_time,p.estimated_amount,p.actual_amount,p.actual_weight,p.amount_paid,p.payment_balance,p.payment_method,p.payment_status,p.collected_at,p.collected_by,p.assigned_staff_id,s.full_name seller_name,s.email seller_email,s.account_type seller_type" + where + " order by " + sortColumn + " " + sortDirection + " limit ? offset ?", args.toArray());
        return new PageResponse<>(items, safePage, safeSize, total);
    }

    private long count(String sql) { Long value = jdbc.queryForObject(sql, Long.class); return value == null ? 0 : value; }

    public record PageResponse<T>(List<T> items, int page, int size, long totalItems) {
        public long totalPages() { return size == 0 ? 0 : (long) Math.ceil((double) totalItems / size); }
    }
}
