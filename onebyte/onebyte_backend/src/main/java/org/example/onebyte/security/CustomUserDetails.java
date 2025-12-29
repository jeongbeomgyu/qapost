package org.example.onebyte.security;

import org.jspecify.annotations.Nullable;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

public class CustomUserDetails implements UserDetails {

    private final String email;
    private final String nickname;
    private final String password;
    private final String name;
    private final Long userId;
    private final List<GrantedAuthority> authorities;

    public CustomUserDetails(String email, String nickname, String password, String name, Long userId, List<GrantedAuthority> authorities) {
        this.email = email;
        this.nickname = nickname;
        this.password = password;
        this.name = name;
        this.userId = userId;
        this.authorities = authorities;
    }

    public String getNickname() {
        return nickname;
    }

    public String getName() {
        return name;
    }

    public Long getUserId() {
        return userId;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return this.authorities;
    }

    @Override
    public @Nullable String getPassword() {
        return this.password;
    }

    @Override
    public String getUsername() {
        return this.email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}
