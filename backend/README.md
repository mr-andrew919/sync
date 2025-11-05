# Watermark Backend

Express server для додавання вотермарок на зображення.

## Встановлення

```bash
npm install
```

## Запуск

```bash
npm start
```

Сервер запуститься на `http://localhost:3001`

## API

### POST /api/watermark

Додає вотермарку "hello moto" до зображення.

**Request Body:**
```json
{
  "image": "data:image/png;base64,iVBORw0KG..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Watermark added successfully",
  "filename": "watermarked-1234567890.png",
  "path": "/path/to/wat-img/watermarked-1234567890.png"
}
```

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-29T22:00:00.000Z"
}
```

## Вотермарка

- Текст: "hello moto"
- Позиція: 10px від верху, по центру
- Колір: білий з тінню
- Розмір шрифту: адаптивний (1/20 ширини картинки, мінімум 24px)

Зображення зберігаються у папці `wat-img/` у корені проекту.

