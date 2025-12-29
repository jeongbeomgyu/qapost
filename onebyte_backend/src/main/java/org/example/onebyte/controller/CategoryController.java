package org.example.onebyte.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.onebyte.dto.category.CategoryRequestDto;
import org.example.onebyte.dto.category.CategoryResponse;
import org.example.onebyte.service.CategoryService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    // 모든 사용자가 조회 가능
    @GetMapping
    public ResponseEntity<List<CategoryResponse>> list() {
        List<CategoryResponse> activeCategory = categoryService.findAllActive();
        return ResponseEntity.ok(activeCategory);
    }

    // 관리자 전용 카테고리 생성
    @PostMapping
    public ResponseEntity<CategoryResponse> createCategory(@Valid @RequestBody CategoryRequestDto request) {

        CategoryResponse createCategory = categoryService.createCategory(request);

        return ResponseEntity.status(HttpStatus.CREATED).body(createCategory);
    }

    // 관리자 전용 카테고리 수정
    @PutMapping("/{id}")
    public ResponseEntity<CategoryResponse> updateCategory(@PathVariable Long id, @RequestBody CategoryRequestDto request) {

        CategoryResponse updateCategory = categoryService.updateCategory(id, request);

        return ResponseEntity.ok(updateCategory);
    }

    // 관리자 전용 카테고리 삭제
    // 왜 update??
    @DeleteMapping("/{id}")
    public ResponseEntity<CategoryResponse> update(@PathVariable Long id) {

        categoryService.deleteCategory(id);

        return ResponseEntity.noContent().build();
    }
}
