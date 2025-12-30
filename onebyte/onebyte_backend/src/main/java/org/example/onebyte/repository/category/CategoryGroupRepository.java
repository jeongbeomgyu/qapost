package org.example.onebyte.repository.category;

import org.example.onebyte.entity.CategoryGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface CategoryGroupRepository extends JpaRepository<CategoryGroup, Long> {

    boolean existsByName(String name);

    @Query("""
           select distinct g
           from CategoryGroup g
           left join fetch g.categories c
           order by g.sortOrder asc, c.sortOrder asc
           """)
    List<CategoryGroup> findAllWithCategoriesOrdered();
}
