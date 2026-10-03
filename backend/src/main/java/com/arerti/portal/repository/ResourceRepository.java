package com.arerti.portal.repository;

import com.arerti.portal.entity.Resource;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface ResourceRepository extends MongoRepository<Resource, String> {
    List<Resource> findAllByOrderByCreatedAtDesc();
    List<Resource> findByAudienceInOrderByCreatedAtDesc(List<String> audiences);
}
