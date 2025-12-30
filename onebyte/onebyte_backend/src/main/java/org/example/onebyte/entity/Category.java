package org.example.onebyte.entity;

import jakarta.persistence.*;
import lombok.*;

@Getter
@Entity
@Table(
        name = "categories",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_categories_group_name",
                columnNames = {"group_id", "name"}
        ),
        indexes = @Index(
                name = "idx_categories_group_sort",
                columnList = "group_id, sort_order"
        )
)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Category extends BaseCategoryEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "group_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_categories_group")
    )
    private CategoryGroup group;

    @Builder
    private Category(CategoryGroup group, String name, int sortOrder, boolean isActive) {
        super(name, sortOrder, isActive);
        this.group = group;
    }

    public static Category create(CategoryGroup group, String name, int sortOrder) {
        return Category.builder()
                .group(group)
                .name(name)
                .sortOrder(sortOrder)
                .isActive(true)
                .build();
    }

    public void changeGroup(CategoryGroup group) {
        this.group = group;
    }
}
