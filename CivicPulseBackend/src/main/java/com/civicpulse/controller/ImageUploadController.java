package com.civicpulse.controller;

import com.civicpulse.dto.issue.ImageUploadResponse;
import com.civicpulse.service.ImageStorageService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;
import java.net.URI;

@RestController
@RequestMapping("/api/uploads")
public class ImageUploadController {
    private final ImageStorageService imageStorageService;

    public ImageUploadController(ImageStorageService imageStorageService) { this.imageStorageService = imageStorageService; }

    @PostMapping(value = "/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ImageUploadResponse> uploadImage(@RequestPart("file") MultipartFile file) {
        ImageUploadResponse stored = imageStorageService.store(file);
        URI absoluteUrl = ServletUriComponentsBuilder.fromCurrentContextPath().path(stored.url()).build().toUri();
        ImageUploadResponse response = new ImageUploadResponse(absoluteUrl.toString(), stored.contentType(), stored.sizeBytes());
        return ResponseEntity.created(absoluteUrl).body(response);
    }
}
