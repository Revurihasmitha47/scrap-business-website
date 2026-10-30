package com.scrapflow.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override public void addViewControllers(ViewControllerRegistry registry) {
        registry.addViewController("/").setViewName("forward:/browser/index.html");
    }
    @Override public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/**").addResourceLocations("classpath:/static/browser/", "classpath:/static/")
            .resourceChain(true).addResolver(new org.springframework.web.servlet.resource.PathResourceResolver() {
                @Override protected Resource getResource(String path, Resource location) throws java.io.IOException {
                    Resource resource = location.createRelative(path);
                    if (resource.exists() && resource.isReadable()) return resource;
                    if (path != null && !path.startsWith("api/") && !path.contains(".")) {
                        Resource index = new ClassPathResource("static/browser/index.html");
                        if (index.exists()) return index;
                    }
                    return null;
                }
            });
    }
}
