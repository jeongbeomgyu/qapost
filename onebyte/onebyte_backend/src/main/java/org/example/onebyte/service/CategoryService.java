package org.example.onebyte.service;


import org.example.onebyte.dto.category.CategoryRequestDto;
import org.example.onebyte.dto.category.CategoryResponse;

import java.util.List;

public interface CategoryService {

    // 카테고리 목록 조회
    List<CategoryResponse> findAllActive();

    // 카테고리 생성
    CategoryResponse createCategory(CategoryRequestDto dto);

    // 카테고리 수정
    CategoryResponse updateCategory(Long id, CategoryRequestDto dto);

    // 카테고리 삭제
    void deleteCategory(Long id);

}
