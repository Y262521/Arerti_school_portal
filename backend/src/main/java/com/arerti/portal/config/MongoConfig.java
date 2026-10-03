package com.arerti.portal.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.config.EnableMongoAuditing;

/**
 * Re-enables MongoDB auditing (@CreatedDate / @LastModifiedDate on Documents).
 * Kept separate from the main app class to avoid the missing-symbol issue on Java 25.
 */
@Configuration
@EnableMongoAuditing
public class MongoConfig {
}
