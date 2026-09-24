# Развёртывание на сервере

Инструкция для домена `антибуллинг.рф`. В конфигах домен пишется в punycode:
**`xn--80acgsbramf8bn.xn--p1ai`**

---

## 1. Что нужно

- сервер с Ubuntu 22.04 или новее, публичный IP, открытые порты 80 и 443
- A-записи `xn--80acgsbramf8bn.xn--p1ai` и `www.xn--80acgsbramf8bn.xn--p1ai`
  указывают на этот IP
- проверь, что записи разошлись: `nslookup xn--80acgsbramf8bn.xn--p1ai`

Caddy получает сертификат через HTTP-проверку, поэтому порт 80 должен быть
открыт даже при том, что сайт работает по HTTPS.

---

## 2. Установка

```bash
curl -fsSL https://get.docker.com | sh

git clone https://github.com/<аккаунт>/antibulling.git
cd antibulling
cp .env.example .env
nano .env
```

Значения для продакшена:

```dotenv
POSTGRES_USER=ryadom
POSTGRES_PASSWORD=<openssl rand -hex 24>
POSTGRES_DB=ryadom

JWT_SECRET=<openssl rand -hex 32>

CORS_ORIGINS=https://xn--80acgsbramf8bn.xn--p1ai,https://www.xn--80acgsbramf8bn.xn--p1ai

OPERATOR_LOGIN=<не psy>
OPERATOR_PASSWORD=<длинный пароль>
OPERATOR_NAME=<имя психолога, которое увидит ребёнок>

SITE_ADDRESS=xn--80acgsbramf8bn.xn--p1ai, www.xn--80acgsbramf8bn.xn--p1ai
ACME_EMAIL=<почта для уведомлений Let's Encrypt>
```

Файл `.env` в `.gitignore` — на сервер он переносится руками и никогда не
попадает в репозиторий.

---

## 3. Запуск

```bash
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml logs -f caddy
```

Сертификат выпускается за несколько секунд. Признак успеха в логах — строка
`certificate obtained successfully`.

Проверка:

```bash
curl -I https://xn--80acgsbramf8bn.xn--p1ai
curl https://xn--80acgsbramf8bn.xn--p1ai/api/health
```

В браузере можно набирать `антибуллинг.рф` — он сам переведёт имя в punycode.

---

## 4. Закрыть пилот от посторонних

Пока идёт тестирование, сайт не должен быть доступен всем. Получи хеш пароля:

```bash
docker run --rm caddy:2-alpine caddy hash-password
```

Добавь в `Caddyfile` перед строкой `reverse_proxy`:

```caddy
basic_auth {
	tester <полученный-хеш>
}
```

Перезапусти Caddy:

```bash
docker compose -f docker-compose.prod.yml up -d caddy
```

---

## 5. Обновление версии

```bash
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

Миграции базы применяются автоматически при старте контейнера бэкенда.
Переменные окружения читаются в момент создания контейнера, поэтому после правки
`.env` нужен именно `up -d`, а не `restart`.

---

## 6. Резервное копирование

```bash
docker compose -f docker-compose.prod.yml exec -T db \
  pg_dump -U ryadom ryadom | gzip > backup-$(date +%F).sql.gz
```

Поставь в cron и храни копии на другом сервере. Дамп содержит переписку детей —
шифруй его и ограничь доступ.

Восстановление:

```bash
gunzip -c backup-2026-09-14.sql.gz | \
  docker compose -f docker-compose.prod.yml exec -T db psql -U ryadom ryadom
```

---

## 7. Если что-то пошло не так

| Симптом | Причина и решение |
|---|---|
| Caddy не выдаёт сертификат | порт 80 закрыт файрволом или A-запись ещё не разошлась |
| 502 от Caddy | бэкенд не поднялся — `docker compose -f docker-compose.prod.yml logs backend` |
| В логах нет строки про учётную запись психолога | не заданы `OPERATOR_LOGIN` / `OPERATOR_PASSWORD` либо пароль короче 8 символов |
| Вход в панель даёт 401 | пароль в базе не совпал с `.env`; пересоздай контейнер через `up -d --build backend` |
| `Can't reach database server` | база ещё стартует; либо пароль не совпал с существующим томом |
| Сообщения не доходят в реальном времени | проверь, что WebSocket проходит: `curl -I` на `/socket.io/` должен отдавать 400, а не 404 |
| Prisma не качает движки при сборке | нет доступа к `binaries.prisma.sh` |
