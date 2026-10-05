package com.arerti.portal.config;

import com.mongodb.client.MongoClient;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.MongoDatabaseFactory;
import org.springframework.data.mongodb.config.EnableMongoAuditing;
import org.springframework.data.mongodb.core.convert.MappingMongoConverter;
import org.springframework.data.mongodb.gridfs.GridFsOperations;
import org.springframework.data.mongodb.gridfs.GridFsTemplate;

@Configuration
@EnableMongoAuditing
public class MongoConfig {

    @Bean
    public GridFsTemplate gridFsTemplate(MongoDatabaseFactory dbFactory,
                                          MappingMongoConverter converter) {
        return new GridFsTemplate(dbFactory, converter);
    }

    @Bean
    public GridFsOperations gridFsOperations(MongoDatabaseFactory dbFactory,
                                              MappingMongoConverter converter) {
        return new GridFsTemplate(dbFactory, converter);
    }
}
