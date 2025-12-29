package org.example.onebyte.repository;

import org.example.onebyte.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CategoryRepository extends JpaRepository<Category, Long> {

    // isActive 가 true 인 것만 조회 -> 활성화 된 글들만 조회 가능
    List<Category> findAllByIsActiveTrue();

    // 코드로 카테로그 찾기
    Optional<Category> findByCode(String code);

    // 중복 카테고리 생성 방지
    boolean existsByCode(String code);

    Optional<Category> findByName(String name);

    boolean existsByCodeAndIdNot(String code, Long id);
    boolean existsByNameAndIdNot(String name, Long id);
}
