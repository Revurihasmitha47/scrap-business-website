package com.scrapflow.data;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.scrapflow.dto.AdminDtos;
import com.scrapflow.dto.PickupDtos;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.util.*;

@Service
public class LocalDataService {
    private final JdbcTemplate jdbc; private final ObjectMapper mapper;
    public LocalDataService(JdbcTemplate jdbc, ObjectMapper mapper) { this.jdbc=jdbc; this.mapper=mapper; }
    public JsonNode clients() { return json(jdbc.queryForList("select id,name,slug,is_active from clients where is_active=true order by name")); }
    public JsonNode categories(UUID client) { return json(jdbc.queryForList("select id,client_id,name,is_active from scrap_categories where client_id=? and is_active=true order by name", client)); }
    public JsonNode rates(UUID client) { return json(jdbc.queryForList("select r.id,r.client_id,r.category_id,c.name as category_name,r.rate_per_kg,r.effective_from from scrap_rates r join scrap_categories c on c.id=r.category_id where r.client_id=? and r.is_active=true order by r.effective_from desc", client)); }
    public JsonNode staff() { return json(jdbc.queryForList("select id,full_name,account_type,account_status from profiles where account_type='PICKUP_STAFF' and account_status='ACTIVE' order by full_name")); }
    public JsonNode pickups(UUID userId, String role) {
        String sql="select pr.id,pr.client_id,pr.seller_id,pr.estimated_quantity,pr.actual_weight,pr.pickup_address,pr.preferred_date,pr.preferred_time,pr.status,pr.final_amount,pr.created_at from pickup_requests pr "; List<Object> args=new ArrayList<>();
        if("HOME_SELLER".equals(role)||"BULK_SELLER".equals(role)){sql+="where pr.seller_id=? ";args.add(userId);} else if("PICKUP_STAFF".equals(role)){sql+="join pickup_assignments pa on pa.pickup_request_id=pr.id where pa.staff_user_id=? and pr.status not in ('CANCELLED','COMPLETED') ";args.add(userId);} sql+="order by pr.created_at desc";
        List<Map<String,Object>> rows=jdbc.queryForList(sql,args.toArray()); for(Map<String,Object> row:rows) row.put("pickup_request_items",jdbc.queryForList("select id,category_id,estimated_quantity,actual_weight from pickup_request_items where pickup_request_id=? order by id",row.get("id"))); return json(rows);
    }
    @Transactional public JsonNode submit(UUID seller,PickupDtos.Create req){UUID id=UUID.randomUUID();BigDecimal total=req.items().stream().map(PickupDtos.Item::estimatedQuantity).reduce(BigDecimal.ZERO,BigDecimal::add);jdbc.update("insert into pickup_requests(id,client_id,seller_id,estimated_quantity,pickup_address,preferred_date,preferred_time,status) values(?,?,?, ?, ?::jsonb, ?, ?, 'REQUESTED')",id,req.clientId(),seller,total,req.pickupAddress().toString(),req.preferredDate(),req.preferredTime());for(PickupDtos.Item i:req.items())jdbc.update("insert into pickup_request_items(id,pickup_request_id,category_id,estimated_quantity) values(?,?,?,?)",UUID.randomUUID(),id,i.categoryId(),i.estimatedQuantity());return json(jdbc.queryForMap("select * from pickup_requests where id=?",id));}
    public JsonNode createCategory(AdminDtos.Category r){UUID id=UUID.randomUUID();jdbc.update("insert into scrap_categories(id,client_id,name,is_active) values(?,?,?,true)",id,r.clientId(),r.name().trim());return json(jdbc.queryForMap("select * from scrap_categories where id=?",id));}
    public JsonNode createClient(AdminDtos.Client r){UUID id=UUID.randomUUID();jdbc.update("insert into clients(id,name,slug,is_active) values(?,?,?,true)",id,r.name().trim(),r.slug().trim().toLowerCase());return json(jdbc.queryForMap("select * from clients where id=?",id));}
    public JsonNode publishRate(AdminDtos.Rate r){UUID id=UUID.randomUUID();jdbc.update("update scrap_rates set is_active=false where client_id=? and category_id=?",r.clientId(),r.categoryId());jdbc.update("insert into scrap_rates(id,client_id,category_id,rate_per_kg,effective_from,is_active) values(?,?,?,?,coalesce(?,now()),true)",id,r.clientId(),r.categoryId(),r.ratePerKg(),r.effectiveFrom());return json(jdbc.queryForMap("select * from scrap_rates where id=?",id));}
    public JsonNode assign(UUID pickup,UUID staff,UUID actor,boolean reassign){if(reassign)jdbc.update("update pickup_assignments set staff_user_id=?,assigned_by=? where pickup_request_id=?",staff,actor,pickup);else jdbc.update("insert into pickup_assignments(pickup_request_id,staff_user_id,assigned_by) values(?,?,?)",pickup,staff,actor);jdbc.update("update pickup_requests set status='ASSIGNED' where id=?",pickup);return json(jdbc.queryForMap("select * from pickup_requests where id=?",pickup));}
    public JsonNode status(UUID pickup,String status){jdbc.update("update pickup_requests set status=? where id=?",status.toUpperCase(),pickup);return json(jdbc.queryForMap("select * from pickup_requests where id=?",pickup));}
    @Transactional public JsonNode picked(UUID pickup,PickupDtos.StaffUpdate req){for(PickupDtos.ItemWeight w:req.itemWeights())jdbc.update("update pickup_request_items set actual_weight=? where id=? and pickup_request_id=?",w.actualWeight(),w.itemId(),pickup);jdbc.update("update pickup_requests set status='PICKED_UP',actual_weight=(select coalesce(sum(actual_weight),0) from pickup_request_items where pickup_request_id=?) where id=?",pickup,pickup);return json(jdbc.queryForMap("select * from pickup_requests where id=?",pickup));}
    private JsonNode json(Object value){return mapper.valueToTree(value);}
}
