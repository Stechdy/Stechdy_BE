# S-Techdy Backend API

Backend API cho ứng dụng S-Techdy sử dụng Node.js, Express và MongoDB.

## Cài đặt

```bash
# Cài đặt dependencies
npm install

# Copy file .env.example thành .env và cấu hình
cp .env.example .env
```

## Cấu hình

Cập nhật file `.env` với thông tin của bạn:

```
PORT=3001
MONGODB_URI=mongodb://localhost:27017/s-techdy
JWT_SECRET=your_jwt_secret_key_here
NODE_ENV=development
```

## Chạy server

```bash
# Development mode với nodemon
npm run dev

# Production mode
npm start
```

## API Endpoints

### Users
- `POST /api/users/register` - Đăng ký user mới
- `POST /api/users/login` - Đăng nhập
- `GET /api/users/profile` - Lấy thông tin profile (Private)
- `PUT /api/users/profile` - Cập nhật profile (Private)

### Products
- `GET /api/products` - Lấy tất cả products
- `GET /api/products/:id` - Lấy product theo ID
- `POST /api/products` - Tạo product mới (Private)
- `PUT /api/products/:id` - Cập nhật product (Private)
- `DELETE /api/products/:id` - Xóa product (Admin)

## Database Models

### User
- name
- email (unique)
- password (hashed)
- role (user/admin)
- isActive
- timestamps

### Product
- name
- description
- price
- category
- stock
- images
- rating
- numReviews
- isActive
- createdBy (ref User)
- timestamps
