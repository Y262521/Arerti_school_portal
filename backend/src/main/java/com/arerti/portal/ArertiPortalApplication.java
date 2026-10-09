package com.arerti.portal;

import jakarta.annotation.PostConstruct;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

import java.util.TimeZone;

@SpringBootApplication
@EnableJpaAuditing
@EnableCaching
public class ArertiPortalApplication {

    @PostConstruct
    public void init() {
        TimeZone.setDefault(TimeZone.getTimeZone("Africa/Addis_Ababa"));
    }

    public static void main(String[] args) {
        SpringApplication.run(ArertiPortalApplication.class, args);
    }
}
