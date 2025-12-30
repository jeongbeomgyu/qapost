package org.example.onebyte.repository.category;

import org.example.onebyte.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CategoryRepository extends JpaRepository<Category, Long> {

    List<Category> findByGroupIdOrderBySortOrderAsc(Long groupId);

    boolean existsByGroupIdAndName(Long groupId, String name);

    List<Category> findAllByIsActiveTrueOrderBySortOrderAsc();
}
