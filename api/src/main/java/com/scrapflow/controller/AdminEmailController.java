package com.scrapflow.controller;

import com.fasterxml.jackson.databind.annotation.JsonNaming;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.scrapflow.auth.SessionUserService;
import com.scrapflow.service.EmailSecretService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;

@RestController
@RequestMapping("/api/admin/email")
public class AdminEmailController {
    private static final String MASK = "********";
    private final JdbcTemplate jdbc; private final SessionUserService users; private final EmailSecretService secrets;
    public AdminEmailController(JdbcTemplate jdbc, SessionUserService users, EmailSecretService secrets) { this.jdbc=jdbc; this.users=users; this.secrets=secrets; }

    @GetMapping("/configurations") public List<Map<String,Object>> configurations() { users.require("ADMIN"); return jdbc.queryForList("select id,name,environment,provider,smtp_host,smtp_port,smtp_username,from_email,from_name,smtp_auth,smtp_start_tls,smtp_ssl,enabled,notes,created_at,updated_at from email_configurations order by updated_at desc"); }
    @PostMapping("/configurations") public Map<String,Object> saveConfiguration(@Valid @RequestBody EmailConfigRequest r) { users.require("ADMIN");
        String password=r.smtpPassword(); if(password==null||password.isBlank()||MASK.equals(password)) { if(r.id()==null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"SMTP password is required"); password=jdbc.queryForObject("select smtp_password from email_configurations where id=?",String.class,r.id()); }
        UUID id=r.id()==null?UUID.randomUUID():r.id(); if(r.enabled()) jdbc.update("update email_configurations set enabled=false where environment=?", r.environment().trim().toUpperCase());
        jdbc.update("insert into email_configurations(id,name,environment,provider,smtp_host,smtp_port,smtp_username,smtp_password,from_email,from_name,smtp_auth,smtp_start_tls,smtp_ssl,enabled,notes,updated_at) values(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,now()) on conflict (id) do update set name=excluded.name,environment=excluded.environment,provider=excluded.provider,smtp_host=excluded.smtp_host,smtp_port=excluded.smtp_port,smtp_username=excluded.smtp_username,smtp_password=excluded.smtp_password,from_email=excluded.from_email,from_name=excluded.from_name,smtp_auth=excluded.smtp_auth,smtp_start_tls=excluded.smtp_start_tls,smtp_ssl=excluded.smtp_ssl,enabled=excluded.enabled,notes=excluded.notes,updated_at=now()",id,r.name().trim(),r.environment().trim().toUpperCase(),r.provider(),r.smtpHost().trim(),r.smtpPort(),r.smtpUsername().trim(),secrets.encrypt(password),r.fromEmail().trim(),r.fromName(),r.smtpAuth(),r.smtpStartTls(),r.smtpSsl(),r.enabled(),r.notes()); return jdbc.queryForMap("select id,name,environment,provider,smtp_host,smtp_port,smtp_username,from_email,from_name,smtp_auth,smtp_start_tls,smtp_ssl,enabled,notes,created_at,updated_at from email_configurations where id=?",id);
    }
    @PatchMapping("/configurations/{id}/status") public Map<String,Object> status(@PathVariable UUID id,@RequestBody Map<String,Boolean> body){users.require("ADMIN"); boolean enabled=Boolean.TRUE.equals(body.get("enabled")); if(enabled) jdbc.update("update email_configurations set enabled=false where environment=(select environment from email_configurations where id=?)",id); jdbc.update("update email_configurations set enabled=?,updated_at=now() where id=?",enabled,id); return jdbc.queryForMap("select id,name,environment,provider,smtp_host,smtp_port,smtp_username,from_email,from_name,smtp_auth,smtp_start_tls,smtp_ssl,enabled,notes,created_at,updated_at from email_configurations where id=?",id);}
    @DeleteMapping("/configurations/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) public void deleteConfiguration(@PathVariable UUID id){users.require("ADMIN"); Integer enabled=jdbc.queryForObject("select case when enabled then 1 else 0 end from email_configurations where id=?",Integer.class,id); if(enabled==null) throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Email configuration not found"); if(enabled==1) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Disable the configuration before deleting it"); jdbc.update("delete from email_configurations where id=?",id);}

    @GetMapping("/templates") public List<Map<String,Object>> templates(){users.require("ADMIN");return jdbc.queryForList("select t.id,t.template_type_id,t.template_key,t.name,t.description,t.version,t.subject,t.html_content,t.text_content,t.variables_json,t.active,t.created_at,t.updated_at,tt.type_key template_type_key,tt.name template_type_name from email_templates t left join email_template_types tt on tt.id=t.template_type_id order by t.updated_at desc");}
    @GetMapping("/template-types") public List<Map<String,Object>> templateTypes(){users.require("ADMIN");return jdbc.queryForList("select id,type_key,name,description,active,created_at,updated_at from email_template_types where active=true order by name");}
    @PostMapping("/template-types") public Map<String,Object> saveTemplateType(@Valid @RequestBody EmailTemplateTypeRequest r){users.require("ADMIN"); UUID id=r.id()==null?UUID.randomUUID():r.id(); String key=r.typeKey().trim().toUpperCase().replaceAll("[^A-Z0-9_.-]","_"); jdbc.update("insert into email_template_types(id,type_key,name,description,active,updated_at) values(?,?,?,?,?,now()) on conflict (id) do update set type_key=excluded.type_key,name=excluded.name,description=excluded.description,active=excluded.active,updated_at=now()",id,key,r.name().trim(),r.description(),r.active()); return jdbc.queryForMap("select id,type_key,name,description,active,created_at,updated_at from email_template_types where id=?",id);}
    @PostMapping("/templates") public Map<String,Object> saveTemplate(@Valid @RequestBody EmailTemplateRequest r){users.require("ADMIN"); UUID id=r.id()==null?UUID.randomUUID():r.id(); String key=r.templateKey().trim().toUpperCase().replaceAll("[^A-Z0-9_.-]","_"); int version=r.version()==null||r.version()<1?1:r.version(); jdbc.update("insert into email_templates(id,template_type_id,template_key,name,description,version,subject,html_content,text_content,variables_json,active,updated_at) values(?,?,?,?,?,?,?, ?,?,cast(? as jsonb),?,now()) on conflict (id) do update set template_type_id=excluded.template_type_id,template_key=excluded.template_key,name=excluded.name,description=excluded.description,version=excluded.version,subject=excluded.subject,html_content=excluded.html_content,text_content=excluded.text_content,variables_json=excluded.variables_json,active=excluded.active,updated_at=now()",id,r.templateTypeId(),key,r.name().trim(),r.description(),version,r.subject().trim(),r.htmlContent(),r.textContent(),r.variablesJson()==null?"{}":r.variablesJson(),r.active()); return jdbc.queryForMap("select t.id,t.template_type_id,t.template_key,t.name,t.description,t.version,t.subject,t.html_content,t.text_content,t.variables_json,t.active,t.created_at,t.updated_at,tt.type_key template_type_key,tt.name template_type_name from email_templates t left join email_template_types tt on tt.id=t.template_type_id where t.id=?",id);}
    @PatchMapping("/templates/{id}/status") public Map<String,Object> templateStatus(@PathVariable UUID id,@RequestBody Map<String,Boolean> body){users.require("ADMIN");jdbc.update("update email_templates set active=?,updated_at=now() where id=?",Boolean.TRUE.equals(body.get("active")),id);return jdbc.queryForMap("select id,template_key,name,subject,html_content,text_content,variables_json,active,created_at,updated_at from email_templates where id=?",id);}
    @DeleteMapping("/templates/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) public void deleteTemplate(@PathVariable UUID id){users.require("ADMIN");jdbc.update("delete from email_templates where id=?",id);}

    @JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
    public record EmailConfigRequest(UUID id,@NotBlank String name,@NotBlank String environment,@NotBlank String provider,@NotBlank String smtpHost,@NotNull Integer smtpPort,@NotBlank String smtpUsername,String smtpPassword,@NotBlank @Email String fromEmail,String fromName,Boolean smtpAuth,Boolean smtpStartTls,Boolean smtpSsl,boolean enabled,String notes){}
    @JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
    public record EmailTemplateRequest(UUID id,UUID templateTypeId,@NotBlank String templateKey,@NotBlank String name,String description,Integer version,@NotBlank String subject,@NotBlank String htmlContent,String textContent,String variablesJson,boolean active){}
    @JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
    public record EmailTemplateTypeRequest(UUID id,@NotBlank String typeKey,@NotBlank String name,String description,boolean active){}
}
