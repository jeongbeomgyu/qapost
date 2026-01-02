package org.example.onebyte.controller.admin;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.onebyte.dto.admin.category.*;
import org.example.onebyte.service.admin.AdminCategoryImpl;
import org.example.onebyte.service.admin.AdminCategoryService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@RequestMapping("/api/admin")
public class AdminCategoryController {

    private final AdminCategoryService adminCategoryService;

    // 트리 조회
    @GetMapping("/categories/tree")
    public ResponseEntity<List<CategoryTreeResponse>> tree() {
        return ResponseEntity.ok(adminCategoryService.getTree());
    }

    // ===== 대분류 =====
    @PostMapping("/category-groups")
    public ResponseEntity<Void> createGroup(@Valid @RequestBody CategoryGroupRequest req) {
        Long id = adminCategoryService.createGroup(req);
        return ResponseEntity.created(URI.create("/api/admin/category-groups/" + id)).build();
    }

    @PatchMapping("/category-groups/{groupId}")
    public ResponseEntity<Void> updateGroup(@PathVariable Long groupId,
                                            @Valid @RequestBody CategoryGroupRequest req) {
        adminCategoryService.updateGroup(groupId, req);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/category-groups/{groupId}")
    public ResponseEntity<Void> deleteGroup(@PathVariable Long groupId) {
        adminCategoryService.deleteGroup(groupId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/category-groups/reorder")
    public ResponseEntity<Void> reorderGroups(@Valid @RequestBody CategoryGroupReorderRequest req) {
        adminCategoryService.reorderGroups(req);
        return ResponseEntity.noContent().build();
    }

    // ===== 소분류 =====
    @PostMapping("/categories")
    public ResponseEntity<Void> createCategory(@Valid @RequestBody CategoryRequest req) {
        Long id = adminCategoryService.createCategory(req);
        return ResponseEntity.created(URI.create("/api/admin/categories/" + id)).build();
    }

    @PatchMapping("/categories/{categoryId}")
    public ResponseEntity<Void> updateCategory(@PathVariable Long categoryId,
                                               @Valid @RequestBody CategoryRequest req) {
        adminCategoryService.updateCategory(categoryId, req);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/categories/{categoryId}")
    public ResponseEntity<Void> deleteCategory(@PathVariable Long categoryId) {
        adminCategoryService.deleteCategory(categoryId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/categories/reorder")
    public ResponseEntity<Void> reorderCategories(@Valid @RequestBody CategoryReorderRequest req) {
        adminCategoryService.reorderCategories(req);
        return ResponseEntity.noContent().build();
    }
}
