package org.example.onebyte.service.admin;

import lombok.RequiredArgsConstructor;
import org.example.onebyte.dto.admin.category.*;
import org.example.onebyte.entity.Category;
import org.example.onebyte.entity.CategoryGroup;
import org.example.onebyte.exception.ConflictException;
import org.example.onebyte.repository.BoardRepository;
import org.example.onebyte.repository.category.CategoryGroupRepository;
import org.example.onebyte.repository.category.CategoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class AdminCategoryService {

    private final CategoryGroupRepository groupRepository;
    private final CategoryRepository categoryRepository;
    private final BoardRepository boardRepository;

    // ===== 트리 조회 =====
    @Transactional(readOnly = true)
    public List<CategoryTreeResponse> getTree() {
        List<CategoryGroup> groups = groupRepository.findAllWithCategoriesOrdered();

        return groups.stream()
                .map(g -> new CategoryTreeResponse(
                        g.getId(),
                        g.getName(),
                        g.getSortOrder(),
                        g.isActive(),
                        g.getCategories().stream()
                                .map(c -> new CategoryResponse(
                                        c.getId(),
                                        c.getName(),
                                        c.getSortOrder(),
                                        c.isActive()
                                ))
                                .toList()
                ))
                .toList();
    }

    // ===== 대분류 =====
    public Long createGroup(CategoryGroupRequest req) {
        if (groupRepository.existsByName(req.name())) {
            throw new ConflictException("이미 존재하는 대분류 이름입니다.");
        }

        CategoryGroup group = CategoryGroup.builder()
                .name(req.name())
                .sortOrder(req.sortOrder())
                .isActive(req.isActive())
                .build();

        return groupRepository.save(group).getId();
    }

    public void updateGroup(Long groupId, CategoryGroupRequest req) {
        CategoryGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("대분류를 찾을 수 없습니다."));

        if (!group.getName().equals(req.name()) && groupRepository.existsByName(req.name())) {
            throw new ConflictException("이미 존재하는 대분류 이름입니다.");
        }

        group.rename(req.name());
        group.changeSortOrder(req.sortOrder());

        if (req.isActive()) group.activate();
        else group.deactivate();
    }

    public void deleteGroup(Long groupId) {
        // 대분류 아래 글 존재하면 삭제 불가
        if (boardRepository.existsByGroupId(groupId)) {
            throw new ConflictException("해당 대분류 하위에 게시글이 존재하여 삭제할 수 없습니다.");
        }
        // 소분류 남아있으면 삭제 불가(안전)
        if (!categoryRepository.findByGroupIdOrderBySortOrderAsc(groupId).isEmpty()) {
            throw new ConflictException("해당 대분류에 소분류가 남아 있어 삭제할 수 없습니다.");
        }

        groupRepository.deleteById(groupId);
    }

    public void reorderGroups(CategoryGroupReorderRequest req) {
        List<Long> ids = req.orderedGroupIds();
        for (int i = 0; i < ids.size(); i++) {
            Long id = ids.get(i);
            CategoryGroup g = groupRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("대분류를 찾을 수 없습니다. id=" + id));
            g.changeSortOrder(i + 1);
        }
    }

    // ===== 소분류 =====
    public Long createCategory(CategoryRequest req) {
        CategoryGroup group = groupRepository.findById(req.groupId())
                .orElseThrow(() -> new IllegalArgumentException("대분류를 찾을 수 없습니다."));

        if (categoryRepository.existsByGroupIdAndName(req.groupId(), req.name())) {
            throw new ConflictException("이미 존재하는 소분류 이름입니다.");
        }

        Category category = Category.builder()
                .group(group)
                .name(req.name())
                .sortOrder(req.sortOrder())
                .isActive(req.isActive())
                .build();

        return categoryRepository.save(category).getId();
    }

    public void updateCategory(Long categoryId, CategoryRequest req) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new IllegalArgumentException("소분류를 찾을 수 없습니다."));

        CategoryGroup group = groupRepository.findById(req.groupId())
                .orElseThrow(() -> new IllegalArgumentException("대분류를 찾을 수 없습니다."));

        boolean groupChanged = !category.getGroup().getId().equals(group.getId());
        boolean nameChanged = !category.getName().equals(req.name());
        if ((groupChanged || nameChanged) && categoryRepository.existsByGroupIdAndName(group.getId(), req.name())) {
            throw new ConflictException("이미 존재하는 소분류 이름입니다.");
        }

        category.changeGroup(group);
        category.rename(req.name());
        category.changeSortOrder(req.sortOrder());

        if (req.isActive()) category.activate();
        else category.deactivate();
    }

    public void deleteCategory(Long categoryId) {
        if (boardRepository.existsByCategoryId(categoryId)) {
            throw new ConflictException("해당 소분류에 게시글이 존재하여 삭제할 수 없습니다.");
        }
        categoryRepository.deleteById(categoryId);
    }

    public void reorderCategories(CategoryReorderRequest req) {
        Long groupId = req.groupId();
        List<Long> ordered = req.orderedCategoryIds();

        // 그룹 소속 검증(잘못된 ID 섞이면 막음)
        List<Category> groupCategories = categoryRepository.findByGroupIdOrderBySortOrderAsc(groupId);

        for (int i = 0; i < ordered.size(); i++) {
            Long id = ordered.get(i);

            Category c = groupCategories.stream()
                    .filter(x -> x.getId().equals(id))
                    .findFirst()
                    .orElseThrow(() -> new IllegalArgumentException("해당 대분류에 속하지 않은 소분류입니다. id=" + id));

            c.changeSortOrder(i + 1);
        }
    }
}
