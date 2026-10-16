package com.arerti.portal.repository;

import com.arerti.portal.entity.SupervisorClassAssignment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SupervisorClassAssignmentRepository extends JpaRepository<SupervisorClassAssignment, Long> {

    List<SupervisorClassAssignment> findBySupervisor_Username(String username);

    List<SupervisorClassAssignment> findBySupervisorId(Long supervisorId);

    boolean existsBySupervisorIdAndSectionId(Long supervisorId, Long sectionId);

    void deleteBySupervisorIdAndSectionId(Long supervisorId, Long sectionId);
}
