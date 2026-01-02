package org.example.onebyte.controller;

import lombok.RequiredArgsConstructor;
import org.example.onebyte.dto.category.PublicCategoryTreeResponse;
import org.example.onebyte.service.UserCategoryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
public class PublicCategoryController {

    private final UserCategoryService userCategoryService;

    @GetMapping("/categories/tree")
    public ResponseEntity<List<PublicCategoryTreeResponse>> tree() {
        return ResponseEntity.ok(userCategoryService.findAllActive());
    }
}
