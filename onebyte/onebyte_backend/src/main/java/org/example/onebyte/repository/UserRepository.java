package org.example.onebyte.repository;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.example.onebyte.entity.User;
import org.example.onebyte.type.UserStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User,Long> {

    //회원가입 및 회원수정 중복체크
    boolean existsByEmail(String email);
    boolean existsByNickname(String nickname);

    //회원조회
    Optional<User> findByEmail(String email);
    Optional<User> findByNickname(String nickname);

    boolean existsByNicknameAndIdNot(String nickname, Long id);

    // 관리자 - 회원 조회
    // status : 전체, 활성화, 탈퇴, 차단 멤버 조회
    List<User> findAllByStatusOrderByIdDesc(UserStatus status);

    long countByStatus(UserStatus status);

    long countByStatusIn(Collection<UserStatus> statuses); // 선택

    List<User> findByStatus(UserStatus status); // 필요하면

    Page<User> findByStatus(UserStatus status, Pageable pageable); // 관리자 목록 페이징이면

}

//userRepository : 테스트
