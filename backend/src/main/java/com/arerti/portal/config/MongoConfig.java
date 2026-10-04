package com.arerti.portal.config;

import com.mongodb.ConnectionString;
import com.mongodb.MongoClientSettings;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.config.AbstractMongoClientConfiguration;
import org.springframework.data.mongodb.config.EnableMongoAuditing;

import javax.net.ssl.SSLContext;
import java.security.NoSuchAlgorithmException;

@Configuration
@EnableMongoAuditing
public class MongoConfig extends AbstractMongoClientConfiguration {

    @Value("${spring.data.mongodb.uri}")
    private String mongoUri;

    @Override
    protected String getDatabaseName() {
        // Extract DB name from URI or default to arerti_portal
        return "arerti_portal";
    }

    @Override
    public MongoClient mongoClient() {
        try {
            SSLContext sslContext = SSLContext.getDefault();
            MongoClientSettings settings = MongoClientSettings.builder()
                    .applyConnectionString(new ConnectionString(mongoUri))
                    .applyToSslSettings(ssl -> {
                        ssl.enabled(true);
                        ssl.context(sslContext);
                    })
                    .build();
            return MongoClients.create(settings);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("Failed to initialise SSL context for MongoDB", e);
        }
    }
}
