package org.example.onebyte.security;

import org.jspecify.annotations.Nullable;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;

import java.util.Collection;
import java.util.Collections;

public class JwtAuthenticationToken extends AbstractAuthenticationToken {

    private final Object principal;
    private Object credentials;

    public JwtAuthenticationToken(Collection<? extends GrantedAuthority> authorities, Object principal, Object credentials) {
        super(authorities);
        this.principal = principal;
        this.credentials = credentials;
        setAuthenticated(true);
    }

    public JwtAuthenticationToken(String token) {
        super(Collections.emptyList());
        this.principal = null;
        this.credentials = token;
        setAuthenticated(false);

    }

    @Override
    public @Nullable Object getCredentials() {
        return this.credentials;
    }

    @Override
    public @Nullable Object getPrincipal() {
        return this.principal;
    }
}
