package com.scrapflow.controller;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
@RestController @RequestMapping("/api/config") public class PublicConfigController { @GetMapping public Map<String,String> config() { return Map.of("auth", "local", "database", "postgresql"); } }
