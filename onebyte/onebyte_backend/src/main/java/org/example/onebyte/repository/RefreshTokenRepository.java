package org.example.onebyte.repository;

import org.example.onebyte.entity.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    Optional<RefreshToken> findByToken(String token);
    Optional<RefreshToken> findByUserId(Long userId);

    void deleteByToken(String token);

    void deleteByUserId(Long userId);


}
