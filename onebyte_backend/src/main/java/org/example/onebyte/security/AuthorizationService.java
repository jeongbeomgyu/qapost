package org.example.onebyte.security;


import org.example.onebyte.exception.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class AuthorizationService {

    // resourceOwnerId -> 리소스 작성자, resource -> 리소스 종류, resourceId -> 해당 리소스 Id, action -> 수정, 삭제 등 동작
    public void checkPermission(Long resourceOwnerId, String resource, Long resourceId, String action) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth == null || !auth.isAuthenticated() || auth.getPrincipal().equals("anonymousUser")) {
            throw new AccessDeniedException("인증 정보가 없거나 만료되었습니다.");
        }

        Object principal = auth.getPrincipal();
        if (!(principal instanceof CustomUserDetails)) {
            throw new AccessDeniedException("인증 정보가 유효하지 않습니다.");
        }

        CustomUserDetails userDetails = (CustomUserDetails) auth.getPrincipal();

        boolean isAdmin = userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        boolean isOwner = userDetails.getUserId().equals(resourceOwnerId);

        if (!isAdmin && !isOwner) {
            throw new AccessDeniedException(resource, resourceId, action);
        }
    }
}
