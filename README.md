# Quest Platform

Платформа онлайн-расследований и интерактивных квестов.

## Что это

Веб-сервис, где:
- авторы создают квесты через админку как данные (не код);
- игроки покупают доступ, создают комнату и приглашают друзей;
- команда проходит расследование в реальном времени.

Движок универсален: дом, город, лес, поезд, бункер, цифровое расследование —
всё описывается данными, без правки Java-кода.

## Стек

- **Frontend:** React, TypeScript, Vite, React Router, TanStack Query
- **Backend:** Java 21, Spring Boot 3, Spring Security, Spring Data JPA
- **DB:** PostgreSQL + Flyway
- **Storage:** S3-совместимое (Yandex Object Storage / MinIO локально)
- **Realtime:** WebSocket + STOMP
- **Voice:** LiveKit (позже)
- **Infra:** Docker, Docker Compose, Git

## Статус

В разработке. Этап: подготовка окружения и репозитория.

## Документация

См. папку [`docs/`](./docs/).

## Структура проекта
