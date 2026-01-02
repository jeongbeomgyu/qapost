package org.example.onebyte.service;

import lombok.RequiredArgsConstructor;
import org.example.onebyte.dto.category.PublicCategoryTreeResponse;
import org.example.onebyte.repository.category.CategoryGroupRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
public class UserCategoryServiceImpl implements UserCategoryService {

    private final CategoryGroupRepository categoryGroupRepository;

    // ✅ 헤더/메인 공개용: "활성 대분류 + 그 하위 활성 소분류" 트리
    @Override
    @Transactional(readOnly = true)
    public List<PublicCategoryTreeResponse> findAllActive() {

        var groups = categoryGroupRepository.findAllActiveWithActiveCategoriesOrderBySortOrderAsc();

        return groups.stream()
                .filter(g -> g.getIsActive())
                .map(g -> new PublicCategoryTreeResponse(
                        g.getId(),
                        g.getName(),
                        g.getSortOrder(),
                        g.getCategories().stream()
                                .filter(c -> c.getIsActive())
                                .sorted((a, b) -> Integer.compare(a.getSortOrder(), b.getSortOrder()))
                                .map(c -> new PublicCategoryTreeResponse.SubCategoryResponse(
                                        c.getId(),
                                        c.getName(),
                                        c.getSortOrder()
                                ))
                                .toList()
                ))
                .toList();
    }
}
