package org.example.onebyte.security;

import lombok.RequiredArgsConstructor;
import org.example.onebyte.entity.User;
import org.example.onebyte.repository.UserRepository;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new UsernameNotFoundException("사용자를 찾을 수 없습니다: " + email)
                );

        if (Boolean.FALSE.equals(user.getIsActive())) {
            throw new DisabledException("비활성화된 사용자입니다.");
        }

        List<GrantedAuthority> authorities =
                List.of(new SimpleGrantedAuthority(user.getRole().name()));

        return new CustomUserDetails(
                user.getEmail(),
                user.getNickname(),
                user.getPasswordHash(),
                user.getName(),
                user.getId(),
                authorities
        );
    }
}