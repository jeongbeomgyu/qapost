package org.example.onebyte.service;

import lombok.RequiredArgsConstructor;
import org.example.onebyte.dto.category.CategoryResponse;
import org.example.onebyte.repository.BoardRepository;
import org.example.onebyte.repository.category.CategoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
public class UserCategoryServiceImpl implements UserCategoryService {

    private final CategoryRepository categoryRepository;
    private final BoardRepository boardRepository;

    // 활성화된 카테고리 목록만 조회
    @Override
    @Transactional(readOnly = true)
    public List<CategoryResponse> findAllActive() {
        return categoryRepository.findAllByIsActiveTrueOrderBySortOrderAsc().stream()
                .map(CategoryResponse::from)
                .toList();
    }

}
