package com.civicpulse.service;

import com.civicpulse.dto.issue.ImageUploadResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;
import java.util.UUID;

@Service
public class ImageStorageService {
    private static final Map<String, String> EXTENSIONS = Map.of(
        "image/jpeg", ".jpg", "image/png", ".png", "image/webp", ".webp");

    @Value("${app.upload.dir:./uploads}")
    private String uploadDirectory;

    @Value("${app.upload.max-bytes:5242880}")
    private long maxBytes;

    public ImageUploadResponse store(MultipartFile file) {
        if (file == null || file.isEmpty()) throw new IllegalArgumentException("Choose an image to upload");
        if (file.getSize() > maxBytes) throw new IllegalArgumentException("Image must be 5 MB or smaller");
        String contentType = file.getContentType();
        String extension = EXTENSIONS.get(contentType == null ? "" : contentType.toLowerCase());
        if (extension == null) throw new IllegalArgumentException("Only JPEG, PNG and WEBP images are supported");

        try {
            Path directory = Paths.get(uploadDirectory).toAbsolutePath().normalize();
            Files.createDirectories(directory);
            String storedName = UUID.randomUUID().toString().replace("-", "") + extension;
            Path destination = directory.resolve(storedName).normalize();
            if (!destination.startsWith(directory)) throw new IllegalArgumentException("Invalid upload path");
            byte[] bytes = file.getBytes();
            if (!matchesImageSignature(contentType, bytes)) {
                throw new IllegalArgumentException("Image contents do not match the declared JPEG, PNG or WEBP type");
            }
            Files.write(destination, bytes, java.nio.file.StandardOpenOption.CREATE_NEW, java.nio.file.StandardOpenOption.WRITE);
            return new ImageUploadResponse("/uploads/" + storedName, contentType, file.getSize());
        } catch (IOException ex) {
            throw new IllegalStateException("Image upload could not be saved", ex);
        }
    }
    private boolean matchesImageSignature(String contentType, byte[] bytes) {
        if (bytes.length < 12 || contentType == null) return false;
        return switch (contentType.toLowerCase()) {
            case "image/jpeg" -> (bytes[0] & 0xFF) == 0xFF && (bytes[1] & 0xFF) == 0xD8 && (bytes[2] & 0xFF) == 0xFF;
            case "image/png" -> (bytes[0] & 0xFF) == 0x89 && bytes[1] == 0x50 && bytes[2] == 0x4E && bytes[3] == 0x47
                && bytes[4] == 0x0D && bytes[5] == 0x0A && bytes[6] == 0x1A && bytes[7] == 0x0A;
            case "image/webp" -> bytes[0] == 'R' && bytes[1] == 'I' && bytes[2] == 'F' && bytes[3] == 'F'
                && bytes[8] == 'W' && bytes[9] == 'E' && bytes[10] == 'B' && bytes[11] == 'P';
            default -> false;
        };
    }

}
