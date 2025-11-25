# 📮 POSTMAN TEST QO'LLANMASI

## 🚀 Server ishga tushirish
```bash
pnpm dev
```
Server: `http://localhost:3000`

---

## 1️⃣ ADMIN AUTENTIFIKATSIYA

### 1.1 Superadmin Login
**Endpoint:** `POST /api/auth/login`

**Body (JSON):**
```json
{
  "username": "superadmin",
  "password": "superadmin123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1...",
    "refreshToken": "eyJhbGciOiJIUzI1...",
    "admin": {
      "id": 1,
      "username": "superadmin",
      "full_name": "Super Admin",
      "role": "superadmin"
    }
  }
}
```

**Cookie:** `refreshToken` avtomatik saqlanadi

---

### 1.2 Admin yaratish
**Endpoint:** `POST /api/admins`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Body (JSON):**
```json
{
  "username": "manager1",
  "password": "manager123",
  "full_name": "Manager User",
  "role": "manager"
}
```

**Roles:** `superadmin`, `manager`, `operator`

---

### 1.3 Token yangilash
**Endpoint:** `POST /api/auth/refresh`

**Cookie:** `refreshToken` kerak (avtomatik yuboriladi)

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1..."
  }
}
```

---

### 1.4 Logout
**Endpoint:** `POST /api/auth/logout`

**Headers:**
```
Authorization: Bearer {accessToken}
```

---

## 2️⃣ ADMIN BOSHQARUVI (Superadmin)

### 2.1 Barcha adminlarni ko'rish
**Endpoint:** `GET /api/admins`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Query Params (optional):**
- `page=1` - sahifa raqami
- `limit=10` - har sahifada nechta
- `role=manager` - rol bo'yicha filter

---

### 2.2 Admin ma'lumotlarini o'zgartirish
**Endpoint:** `PUT /api/admins/{adminId}`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Body (JSON):**
```json
{
  "full_name": "Updated Name",
  "role": "operator"
}
```

---

### 2.3 Admin parolini o'zgartirish
**Endpoint:** `PUT /api/admins/{adminId}/password`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Body (JSON):**
```json
{
  "oldPassword": "manager123",
  "newPassword": "newpassword123"
}
```

---

### 2.4 Adminni o'chirish
**Endpoint:** `DELETE /api/admins/{adminId}`

**Headers:**
```
Authorization: Bearer {accessToken}
```

---

## 3️⃣ MAHSULOTLAR BOSHQARUVI

### 3.1 Mahsulot qo'shish
**Endpoint:** `POST /api/products`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Body (JSON):**
```json
{
  "name": "iPhone 15 Pro",
  "price": 1200.50,
  "currency_type_id": 1,
  "description": "Latest iPhone model"
}
```

---

### 3.2 Barcha mahsulotlarni ko'rish
**Endpoint:** `GET /api/products`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Query Params:**
- `page=1`
- `limit=10`

---

### 3.3 Mahsulotni yangilash
**Endpoint:** `PUT /api/products/{productId}`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Body (JSON):**
```json
{
  "name": "iPhone 15 Pro Max",
  "price": 1399.99
}
```

---

### 3.4 Mahsulotni o'chirish
**Endpoint:** `DELETE /api/products/{productId}`

**Headers:**
```
Authorization: Bearer {accessToken}
```

---

## 4️⃣ BUYURTMALAR BOSHQARUVI

### 4.1 Barcha buyurtmalarni ko'rish
**Endpoint:** `GET /api/orders`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Query Params:**
- `page=1`
- `limit=10`
- `status=pending` - filter bo'yicha

---

### 4.2 Buyurtma yaratish
**Endpoint:** `POST /api/orders`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Body (JSON):**
```json
{
  "client_id": 1,
  "product_link": "https://example.com/product",
  "quantity": 2,
  "currency_type_id": 1,
  "description": "Urgent delivery needed"
}
```

---

### 4.3 Buyurtmani yangilash
**Endpoint:** `PUT /api/orders/{orderId}`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Body (JSON):**
```json
{
  "summa": 2500.00,
  "description": "Updated description",
  "is_cancelled": false
}
```

---

### 4.4 Buyurtmani bekor qilish
**Endpoint:** `DELETE /api/orders/{orderId}`

**Headers:**
```
Authorization: Bearer {accessToken}
```

---

## 5️⃣ OPERATSIYALAR

### 5.1 Operatsiya qo'shish
**Endpoint:** `POST /api/operations`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Body (JSON):**
```json
{
  "order_id": 1,
  "operation_type": "payment_received",
  "amount": 1200.50,
  "currency_type_id": 1,
  "description": "Payment from client"
}
```

**Operation Types:**
- `payment_received` - to'lov qabul qilindi
- `product_purchased` - mahsulot sotib olindi
- `shipping_paid` - yetkazib berish to'landi
- `other` - boshqa

---

### 5.2 Buyurtma operatsiyalarini ko'rish
**Endpoint:** `GET /api/operations/order/{orderId}`

**Headers:**
```
Authorization: Bearer {accessToken}
```

---

### 5.3 Operatsiyani o'chirish
**Endpoint:** `DELETE /api/operations/{operationId}`

**Headers:**
```
Authorization: Bearer {accessToken}
```

---

## 6️⃣ MIJOZLAR (CLIENT API)

### 6.1 Mijoz buyurtmalarini ko'rish
**Endpoint:** `GET /api/client/orders`

**Headers:**
```
telegram-id: 123456789
```

**Query Params:**
- `page=1`
- `limit=10`

---

### 6.2 Mijoz buyurtma yaratish
**Endpoint:** `POST /api/client/orders`

**Headers:**
```
telegram-id: 123456789
```

**Body (JSON):**
```json
{
  "product_link": "https://amazon.com/product",
  "quantity": 1,
  "currency_type_id": 1,
  "description": "Black color preferred"
}
```

---

## 🔑 MUHIM ESLATMALAR

### Headers
1. **Admin endpoints:** `Authorization: Bearer {accessToken}`
2. **Client endpoints:** `telegram-id: {telegramId}`

### Error Responses
```json
{
  "success": false,
  "error": "Error message"
}
```

### Success Responses
```json
{
  "success": true,
  "data": { ... }
}
```

---

## 📝 TEST KETMA-KETLIGI

1. **Login qiling:**
   ```
   POST /api/auth/login
   ```

2. **Token oling va saqlang**

3. **Admin yarating:**
   ```
   POST /api/admins
   ```

4. **Mahsulot qo'shing:**
   ```
   POST /api/products
   ```

5. **Buyurtma yarating:**
   ```
   POST /api/orders
   ```

6. **Operatsiya qo'shing:**
   ```
   POST /api/operations
   ```

---

## 🔧 POSTMAN SOZLAMALARI

### Environment Variables
```
base_url: http://localhost:3000
access_token: {login dan olinadi}
telegram_id: 123456789
```

### Authorization
- **Type:** Bearer Token
- **Token:** `{{access_token}}`

### Tests (Login uchun)
```javascript
// Response ni parse qilish
const response = pm.response.json();

// Token ni saqlash
if (response.success && response.data.accessToken) {
    pm.environment.set("access_token", response.data.accessToken);
}
```

---

## 🎯 TELEGRAM BOT TEST

Bot orqali:
1. `/start` - Bot ishga tushadi
2. `/register` - Ro'yxatdan o'tish
3. Email OTP tasdiqlash
4. `Create Order` - Buyurtma berish
5. `My Orders` - Buyurtmalarni ko'rish
6. `Profile` - Profil ko'rish
7. `Logout` - Chiqish

---

## 📊 DATABASE

**PostgreSQL:**
- Host: localhost
- Port: 5432
- Database: ko'rsatilgan nomda
- User: .env da

**Prisma Studio:**
```bash
npx prisma studio
```
Ochiladi: `http://localhost:5555`

---

## ✅ TEKSHIRISH LISTI

- [ ] Server ishga tushdi
- [ ] Login muvaffaqiyatli
- [ ] Token olindi
- [ ] Admin yaratildi
- [ ] Mahsulot qo'shildi
- [ ] Buyurtma yaratildi
- [ ] Operatsiya qo'shildi
- [ ] Telegram bot ishlayapti
- [ ] Email OTP kelmoqda

---

**Muammo bo'lsa:**
- Serverni qayta ishga tushiring: `pnpm dev`
- Database ulanishini tekshiring: `.env` fayl
- Loglarni ko'ring: `logs/` papka
