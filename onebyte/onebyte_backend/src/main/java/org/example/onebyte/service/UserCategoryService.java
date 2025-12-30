package org.example.onebyte.service;


import org.example.onebyte.dto.category.CategoryRequestDto;
import org.example.onebyte.dto.category.CategoryResponse;

import java.util.List;

public interface UserCategoryService {

    // 카테고리 목록 조회
    List<CategoryResponse> findAllActive();
}
