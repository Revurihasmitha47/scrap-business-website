package com.scrapflow.service;

import jakarta.mail.Message;
import jakarta.mail.Session;
import jakarta.mail.Transport;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.Properties;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class EmailService {
    private static final Logger log = LoggerFactory.getLogger(EmailService.class);
    private static final Pattern VARIABLE = Pattern.compile("\\{\\{\\s*([A-Za-z0-9_.-]+)\\s*\\}\\}");
    private final JdbcTemplate jdbc; private final EmailSecretService secrets;
    public EmailService(JdbcTemplate jdbc, EmailSecretService secrets) { this.jdbc = jdbc; this.secrets = secrets; }

    public void send(String templateKey, String recipient, Map<String, ?> variables) {
        log.info("Preparing email template={} recipient={}", templateKey, recipient);
        List<Map<String, Object>> configs = jdbc.queryForList("select * from email_configurations where enabled=true and (environment='ALL' or environment=?) order by case when environment='ALL' then 1 else 0 end, updated_at desc limit 1", currentEnvironment());
        if (configs.isEmpty()) {
            throw new IllegalStateException("No active email configuration found for environment " + currentEnvironment());
        }
        Map<String,Object> config = configs.get(0);
        List<Map<String, Object>> templates = jdbc.queryForList("select subject,html_content,text_content from email_templates where template_key=? and active=true limit 1", templateKey);
        if (templates.isEmpty()) {
            throw new IllegalStateException("No active email template found for key " + templateKey);
        }
        Map<String,Object> template = templates.get(0);
        String subject = render((String) template.get("subject"), variables, false);
        String html = render((String) template.get("html_content"), variables, true);
        String text = template.get("text_content") == null ? null : render((String) template.get("text_content"), variables, false);
        try {
            Properties props = new Properties();
            props.put("mail.smtp.host", config.get("smtp_host")); props.put("mail.smtp.port", String.valueOf(config.get("smtp_port")));
            props.put("mail.smtp.auth", String.valueOf(config.get("smtp_auth"))); props.put("mail.smtp.starttls.enable", String.valueOf(config.get("smtp_start_tls")));
            props.put("mail.smtp.ssl.enable", String.valueOf(config.get("smtp_ssl")));
            props.put("mail.smtp.connectiontimeout", "10000");
            props.put("mail.smtp.timeout", "10000");
            props.put("mail.smtp.writetimeout", "10000");
            Session session = Session.getInstance(props, new jakarta.mail.Authenticator() { protected jakarta.mail.PasswordAuthentication getPasswordAuthentication() { return new jakarta.mail.PasswordAuthentication((String) config.get("smtp_username"), secrets.decrypt((String) config.get("smtp_password"))); }});
            MimeMessage message = new MimeMessage(session); message.setFrom(new InternetAddress((String) config.get("from_email"), (String) config.get("from_name"), StandardCharsets.UTF_8.name()));
            message.setRecipients(Message.RecipientType.TO, InternetAddress.parse(recipient)); message.setSubject(subject, StandardCharsets.UTF_8.name());
            if (text == null || text.isBlank()) message.setContent(html, "text/html; charset=UTF-8"); else { jakarta.mail.Multipart multipart = new jakarta.mail.internet.MimeMultipart("alternative"); jakarta.mail.internet.MimeBodyPart plain = new jakarta.mail.internet.MimeBodyPart(); plain.setText(text, StandardCharsets.UTF_8.name()); jakarta.mail.internet.MimeBodyPart rich = new jakarta.mail.internet.MimeBodyPart(); rich.setContent(html, "text/html; charset=UTF-8"); multipart.addBodyPart(plain); multipart.addBodyPart(rich); message.setContent(multipart); }
            Transport.send(message);
            log.info("Email sent successfully for template={} recipient={}", templateKey, recipient);
        } catch (Exception ex) {
            log.error("Email send failed for template={} recipient={} host={} port={} from={}",
                    templateKey, recipient, config.get("smtp_host"), config.get("smtp_port"), config.get("from_email"), ex);
            throw new IllegalStateException("Email could not be sent", ex);
        }
    }
    private String currentEnvironment() { return System.getProperty("spring.profiles.active", "DEV").toUpperCase(); }
    private String render(String value, Map<String, ?> vars, boolean html) { Matcher m = VARIABLE.matcher(value == null ? "" : value); StringBuffer out = new StringBuffer(); while(m.find()){ Object raw=vars.get(m.group(1)); String replacement=raw==null?"":String.valueOf(raw); if(html) replacement=org.springframework.web.util.HtmlUtils.htmlEscape(replacement); m.appendReplacement(out, Matcher.quoteReplacement(replacement)); } m.appendTail(out); return out.toString(); }
}
