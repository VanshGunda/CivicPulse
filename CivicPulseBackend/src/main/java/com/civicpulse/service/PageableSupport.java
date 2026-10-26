package com.civicpulse.service;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import java.util.Set;

public final class PageableSupport {
    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of(
        "id", "createdAt", "updatedAt", "name", "email", "role", "enabled",
        "title", "status", "priority", "category", "dueAt", "resolvedAt",
        "readAt", "message", "address", "version"
    );

    private PageableSupport() {}

    public static Pageable cap(Pageable pageable, int maxSize, String defaultSortField) {
        int page = Math.max(0, pageable.getPageNumber());
        int size = Math.max(1, Math.min(pageable.getPageSize(), maxSize));
        Sort requestedSort = pageable.getSort();
        boolean validSort = requestedSort.isSorted();
        if (validSort) {
            for (Sort.Order order : requestedSort) {
                if (!ALLOWED_SORT_FIELDS.contains(order.getProperty())) {
                    validSort = false;
                    break;
                }
            }
        }
        Sort sort = validSort ? requestedSort : Sort.by(Sort.Direction.DESC, defaultSortField);
        return PageRequest.of(page, size, sort);
    }
}
