package org.example.onebyte.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.ArrayList;
import java.util.List;


@Getter
@Entity
@Table(
        name = "category_groups",
        uniqueConstraints = @UniqueConstraint(name = "uq_category_groups_name", columnNames = "name")
)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CategoryGroup extends BaseCategoryEntity {

    @OneToMany(mappedBy = "group")
    @OrderBy("sortOrder ASC")
    private List<Category> categories = new ArrayList<>();

    @Builder
    private CategoryGroup(String name, int sortOrder, boolean isActive) {
        super(name, sortOrder, isActive);
    }

    public static CategoryGroup create(String name, int sortOrder) {
        return CategoryGroup.builder()
                .name(name)
                .sortOrder(sortOrder)
                .isActive(true)
                .build();
    }

}
