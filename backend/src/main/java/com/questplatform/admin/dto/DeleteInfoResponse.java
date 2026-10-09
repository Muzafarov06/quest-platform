package com.questplatform.admin.dto;

import java.util.List;
import java.util.UUID;

public record DeleteInfoResponse(
        UUID locationId,
        String locationName,
        int childLocations,
        List<String> childLocationNames,
        long objects,
        long evidencesByLocation,
        long connections,
        long activeSessions,
        boolean isEntry
) {
}