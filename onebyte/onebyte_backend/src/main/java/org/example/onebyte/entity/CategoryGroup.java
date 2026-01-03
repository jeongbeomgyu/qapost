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

    @OneToMany(
            mappedBy = "group",
            cascade = CascadeType.ALL,      // group 삭제 -> categories 삭제
            orphanRemoval = true            // group에서 category 제거 -> category 삭제
    )
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

    public void addCategory(Category category) {
        this.categories.add(category);
        category.changeGroup(this);
    }

    public void removeCategory(Category category) {
        this.categories.remove(category);
        category.changeGroup(null); // changeGroup이 null 허용하면 OK (아래 Category도 바꿔둠)
    }
}
