package org.example.onebyte.service.admin;

import org.example.onebyte.dto.admin.category.CategoryGroupReorderRequest;
import org.example.onebyte.dto.admin.category.CategoryGroupRequest;
import org.example.onebyte.dto.admin.category.CategoryReorderRequest;
import org.example.onebyte.dto.admin.category.CategoryRequest;
import org.example.onebyte.dto.admin.category.CategoryTreeResponse;

import java.util.List;

public interface AdminCategoryService {

    // ===== 트리 조회 =====
    List<CategoryTreeResponse> getTree();

    // ===== 대분류 =====
    Long createGroup(CategoryGroupRequest req);

    void updateGroup(Long groupId, CategoryGroupRequest req);

    void deleteGroup(Long groupId);

    void reorderGroups(CategoryGroupReorderRequest req);

    // ===== 소분류 =====
    Long createCategory(CategoryRequest req);

    void updateCategory(Long categoryId, CategoryRequest req);

    void deleteCategory(Long categoryId);

    void reorderCategories(CategoryReorderRequest req);
}
