package org.example.onebyte.repository;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.example.onebyte.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User,Long> {

    //회원가입 및 회원수정 중복체크
    boolean existsByEmail(String email);
    boolean existsByNickname(String nickname);

    //회원조회
    Optional<User> findByEmail(String email);
    Optional<User> findByNickname(String nickname);

    boolean existsByNicknameAndIdNot(String nickname, Long id);


}
