package org.example.onebyte.service;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.example.onebyte.dto.category.CategoryRequestDto;
import org.example.onebyte.dto.category.CategoryResponse;
import org.example.onebyte.entity.Category;
import org.example.onebyte.repository.BoardRepository;
import org.example.onebyte.repository.CategoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
public class CategoryServiceImpl implements CategoryService{

    private final CategoryRepository categoryRepository;
    private final BoardRepository boardRepository;

    // 활성화된 카테고리 목록만 조회
    @Override
    public List<CategoryResponse> findAllActive() {
        return categoryRepository.findAllByIsActiveTrue().stream()
                .map(CategoryResponse::from)
                .collect(Collectors.toList());
    }

    // 관리자 전용 카테고리 생성
    @Override
    public CategoryResponse createCategory(CategoryRequestDto dto) {

        // 코드 중복 확인 로직
        Optional<Category> byCode = categoryRepository.findByCode(dto.getCode());
        if (byCode.isPresent()) {
            Category existingByCode = byCode.get();
            // 만약 코드 중 비활성화된 상태가 존재한다면 복원
            if (!existingByCode.isActive()) {

                // 이미 다른 카테고리에서 이름을 사용하고 있을 경우
                if (!existingByCode.getName().equals(dto.getName()) && categoryRepository.findByName(dto.getName()).isPresent()) {
                    throw new IllegalArgumentException("이미 해당 이름을 사용하는 다른 카테고리가 존재합니다.");
                }
                existingByCode.activate();
                existingByCode.rename(dto.getName());
                return CategoryResponse.from(existingByCode);
            } else {
                throw new IllegalArgumentException("이미 사용 중인 카테고리 코드입니다.");
            }
        }

        // 이름 중복 확인 로직
        Optional<Category> byName = categoryRepository.findByName(dto.getName());
        if (byName.isPresent()) {
            Category existingByName = byName.get();

            // 만약 이름 중 비활성화된 상태인 카테고리가 존재한다면 복원
            if (!existingByName.isActive()) {
                // 다른 카테고리에서 코드를 사용하고 있을 경우
                if (!existingByName.getCode().equals(dto.getCode()) && categoryRepository.findByCode(dto.getCode()).isPresent()) {
                    throw new IllegalArgumentException("이미 해당 코드를 사용하는 다른 카테고리가 존재합니다.");
                }

                existingByName.activate();
                existingByName.changeCode(dto.getCode());
                return CategoryResponse.from(existingByName);
            } else {
                throw new IllegalArgumentException("이미 사용 중인 카테고리 이름입니다.");
            }
        }

        Category category = Category.builder()
                .code(dto.getCode())
                .name(dto.getName())
                .isActive(dto.getIsActive() != null ? dto.getIsActive() : true)
                .build();

        Category saveCategory = categoryRepository.save(category);

        return CategoryResponse.from(saveCategory);
    }

    // 관리자 전용 카테고리 수정
    @Override
    public CategoryResponse updateCategory(Long id, CategoryRequestDto dto) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("해당 카테고리를 찾을 수 없습니다."));

        if (dto.getName() != null && !category.getName().equals(dto.getName())) {
            if (categoryRepository.existsByNameAndIdNot(dto.getName(), id)) {
                throw new IllegalArgumentException("해당 카테고리 이름은 사용 중 입니다.");
            }
            category.rename(dto.getName());
        }

        if (dto.getCode() != null && !category.getCode().equals(dto.getCode())) {
            if (categoryRepository.existsByCodeAndIdNot(dto.getCode(), id)) {
                throw new IllegalArgumentException("해당 카테고리 코드는 사용 중 입니다.");
            }

            category.changeCode(dto.getCode());
        }

        if (dto.getIsActive() != null) {
            if (dto.getIsActive() && !category.isActive()) {
                category.activate();
            } else if (!dto.getIsActive() && category.isActive()){ // 활성 상태일 때만 삭제 로직 실행
                deleteCategory(id);
            }
        }
        return CategoryResponse.from(category);
    }

    // 관리자 전용 카테고리 삭제
    @Override
    public void deleteCategory(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("카테고리를 찾을 수 없습니다."));

        category.deactivate();

        Category etcCategory = categoryRepository.findByCode("ETC")
                .orElseThrow(() -> new IllegalStateException("기타 카테고리가 시스템에 존재하지 않습니다."));

        boardRepository.updateCategoryBatch(category.getId(), etcCategory.getId());

    }
}
