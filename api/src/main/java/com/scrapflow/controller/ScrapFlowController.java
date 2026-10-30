package com.scrapflow.controller;
import com.fasterxml.jackson.databind.JsonNode;
import com.scrapflow.auth.LocalUserService;
import com.scrapflow.data.LocalDataService;
import com.scrapflow.dto.*;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.UUID;

@RestController @RequestMapping("/api")
public class ScrapFlowController {
    private final LocalDataService data; private final LocalUserService users;
    public ScrapFlowController(LocalDataService data, LocalUserService users) { this.data=data; this.users=users; }
    @GetMapping("/me") public ApiDtos.Me me(){var u=users.current();return new ApiDtos.Me(u.userId(),u.fullName(),u.phone(),u.accountType(),u.accountStatus(),u.memberships());}
    @GetMapping("/clients") public JsonNode clients(){return data.clients();}
    @GetMapping("/categories") public JsonNode categories(@RequestParam UUID clientId){var u=users.current();users.requireClient(u,clientId);return data.categories(clientId);}
    @GetMapping("/rates") public JsonNode rates(@RequestParam UUID clientId){return data.rates(clientId);}
    @GetMapping("/staff") public JsonNode staff(@RequestParam UUID clientId){var u=users.requireRoles("CLIENT_ADMIN","SUPER_ADMIN");users.requireClient(u,clientId);return data.staff();}
    @GetMapping("/pickups") public JsonNode pickups(){var u=users.requireRoles("HOME_SELLER","BULK_SELLER","CLIENT_ADMIN","PICKUP_STAFF","SUPER_ADMIN");return data.pickups(u.userId(),u.accountType());}
    @PostMapping("/pickups") @ResponseStatus(HttpStatus.CREATED) public JsonNode submit(@Valid @RequestBody PickupDtos.Create r){var u=users.requireRoles("HOME_SELLER","BULK_SELLER");users.requireClient(u,r.clientId());return data.submit(u.userId(),r);}
    @PostMapping("/admin/categories") @ResponseStatus(HttpStatus.CREATED) public JsonNode category(@Valid @RequestBody AdminDtos.Category r){var u=users.requireRoles("CLIENT_ADMIN","SUPER_ADMIN");users.requireClient(u,r.clientId());return data.createCategory(r);}
    @PostMapping("/admin/clients") @ResponseStatus(HttpStatus.CREATED) public JsonNode client(@Valid @RequestBody AdminDtos.Client r){users.requireRoles("SUPER_ADMIN");return data.createClient(r);}
    @PostMapping("/admin/rates") @ResponseStatus(HttpStatus.CREATED) public JsonNode rate(@Valid @RequestBody AdminDtos.Rate r){var u=users.requireRoles("CLIENT_ADMIN","SUPER_ADMIN");users.requireClient(u,r.clientId());return data.publishRate(r);}
    @PostMapping("/admin/pickups/{id}/assign") public JsonNode assign(@PathVariable UUID id,@Valid @RequestBody PickupDtos.Assign r){var u=users.requireRoles("CLIENT_ADMIN","SUPER_ADMIN");requirePickupClient(u,id);return data.assign(id,r.staffUserId(),u.userId(),false);}
    @PostMapping("/admin/pickups/{id}/reassign") public JsonNode reassign(@PathVariable UUID id,@Valid @RequestBody PickupDtos.Assign r){var u=users.requireRoles("CLIENT_ADMIN","SUPER_ADMIN");requirePickupClient(u,id);return data.assign(id,r.staffUserId(),u.userId(),true);}
    @PostMapping("/admin/pickups/{id}/status") public JsonNode status(@PathVariable UUID id,@Valid @RequestBody PickupDtos.Status r){var u=users.requireRoles("CLIENT_ADMIN","SUPER_ADMIN");requirePickupClient(u,id);return data.status(id,r.status());}
    @PostMapping("/staff/pickups/{id}/picked-up") public JsonNode picked(@PathVariable UUID id,@Valid @RequestBody PickupDtos.StaffUpdate r){users.requireRoles("PICKUP_STAFF");if(!"PICKED_UP".equalsIgnoreCase(r.status()))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Only PICKED_UP is supported");return data.picked(id,r);}
    private void requirePickupClient(LocalUserService.UserContext u,UUID id){if("SUPER_ADMIN".equals(u.accountType()))return;if(!data.pickups(u.userId(),u.accountType()).toString().contains(id.toString()))throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Pickup not found");}
}
