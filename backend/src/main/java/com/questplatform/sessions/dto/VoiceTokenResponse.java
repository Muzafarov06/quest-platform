package com.questplatform.sessions.dto;

public record VoiceTokenResponse(
        String url,
        String token,
        String roomName,
        String identity
) {
}