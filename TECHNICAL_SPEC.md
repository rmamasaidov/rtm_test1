# TECHNICAL SPECIFICATION
## Personal Finance Management Platform - Expense Control System

**Version:** 1.0  
**Date:** February 2026  
**Languages:** Russian / English  
**Platforms:** Web Application + Mobile Applications (iOS & Android)

---

## 📋 Quick Navigation

- [Executive Summary](#executive-summary)
- [Authentication](#authentication-system)
- [Data Model](#data-model)
- [API Specifications](#api-specifications)
- [Mobile Apps](#mobile-application-specifications)
- [Implementation](#implementation-roadmap)

---

## Executive Summary

### Project Goals

Bilingual (Russian/English) personal finance platform with:
- **Web App** (Progressive Web App)
- **iOS App** (Native, iOS 14+)
- **Android App** (Native, Android 8.0+)
- **Mobile Number Authentication** (SMS/WhatsApp verification)

### Key Features

✅ Real-time expense/income tracking  
✅ Mobile number authentication + biometric  
✅ 30+ predefined categories (bilingual)  
✅ AI-powered budget recommendations  
✅ Multi-currency (UZS, USD, EUR, BTC, ETH, LTC)  
✅ Debt management  
✅ Offline-first mobile apps  
✅ Push notifications  
✅ Receipt capture & OCR  
✅ Data export (PDF, Excel, CSV)

---

## System Architecture

```
┌─────────────────────────────────────────┐
│     CLIENT LAYER                         │
├─────────┬────────┬────────┬─────────────┤
│ Web App │iOS App │Android │ Admin Panel │
│ (React) │(Swift) │(Kotlin)│   (React)   │
└────┬────┴───┬────┴───┬────┴──────┬──────┘
     └────────┴────────┴───────────┘
              │
         API GATEWAY
              │
     ┌────────┴────────┐
     │  Microservices  │
     │  - Auth Service │
     │  - Transaction  │
     │  - Analytics    │
     │  - Notification │
     └────────┬────────┘
              │
     ┌────────┴────────────┐
     │   PostgreSQL        │
     │   Redis (Cache)     │
     │   S3 (Files)        │
     └─────────────────────┘
```

**Technology Stack:**

| Component | Technology |
|-----------|-----------|
| Web Frontend | React 18 + TypeScript + Tailwind |
| iOS App | Swift + SwiftUI |
| Android App | Kotlin + Jetpack Compose |
| Backend API | Node.js + Express + TypeScript |
| Analytics | Python + FastAPI |
| Database | PostgreSQL 15+ |
| Cache | Redis 7+ |
| Storage | AWS S3 / DO Spaces |
| SMS Gateway | Twilio |
| Push Notifications | Firebase Cloud Messaging |

---

## Authentication System

### Mobile Number Authentication Flow

**Registration:**
```
1. User enters mobile number (+998 XX XXX XX XX)
2. System validates format
3. Send 6-digit code via SMS/WhatsApp
4. User enters code (5 min expiration, 3 max attempts)
5. Create account + generate JWT tokens
6. User authenticated
```

**Login:**
```
1. User enters mobile number
2. System checks if exists
3. Send verification code
4. User enters code
5. Generate new JWT tokens
6. User authenticated
```

**Biometric (Mobile Only):**
- Face ID / Touch ID (iOS)
- Fingerprint / Face Unlock (Android)
- Falls back to phone verification if fails
- Biometric data never leaves device

### Security Implementation

**JWT Configuration:**
```typescript
const JWT_CONFIG = {
  accessToken: {
    secret: process.env.JWT_ACCESS_SECRET,
    expiresIn: '15m',
    algorithm: 'HS256'
  },
  refreshToken: {
    secret: process.env.JWT_REFRESH_SECRET,
    expiresIn: '30d',
    algorithm: 'HS256'
  }
};
```

**Rate Limiting:**
```typescript
const RATE_LIMITS = {
  smsRequests: { max: 3, window: '15m' },
  codeVerification: { max: 5, window: '1h' },
  loginAttempts: { max: 5, window: '1h' }
};
```

**Verification Code:**
- 6-digit numeric code
- 5-minute expiration
- Maximum 3 attempts per code
- Auto-delete expired codes

---

## Data Model

### Core Tables

#### users
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    phone_country_code VARCHAR(5) NOT NULL,
    phone_verified BOOLEAN DEFAULT FALSE,
    email VARCHAR(255),
    name VARCHAR(100),
    language VARCHAR(2) DEFAULT 'ru',
    primary_currency VARCHAR(3) DEFAULT 'UZS',
    timezone VARCHAR(50) DEFAULT 'Asia/Tashkent',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);
```

#### transactions
```sql
CREATE TABLE transactions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    date DATE NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'UZS',
    type VARCHAR(10) NOT NULL, -- 'income' | 'expense'
    category_id UUID NOT NULL REFERENCES categories(id),
    description TEXT,
    receipt_url VARCHAR(255),
    is_recurring BOOLEAN DEFAULT FALSE,
    recurring_template_id UUID,
    synced BOOLEAN DEFAULT FALSE,
    device_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);
```

#### categories
```sql
CREATE TABLE categories (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id), -- NULL for system
    name_ru VARCHAR(100) NOT NULL,
    name_en VARCHAR(100) NOT NULL,
    parent_id UUID REFERENCES categories(id),
    icon VARCHAR(50) NOT NULL,
    color VARCHAR(7) NOT NULL, -- #RRGGBB
    type VARCHAR(10) NOT NULL, -- 'income' | 'expense'
    is_system BOOLEAN DEFAULT FALSE,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);
```

#### budgets
```sql
CREATE TABLE budgets (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    month DATE NOT NULL, -- First day of month
    category_id UUID REFERENCES categories(id),
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'UZS',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, month, category_id)
);
```

#### debts
```sql
CREATE TABLE debts (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    type VARCHAR(10) NOT NULL, -- 'creditor' | 'debtor'
    counterparty_name VARCHAR(100) NOT NULL,
    counterparty_phone VARCHAR(20),
    original_amount DECIMAL(15,2) NOT NULL,
    remaining_amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'UZS',
    date_issued DATE NOT NULL,
    date_due DATE,
    status VARCHAR(20) DEFAULT 'active',
    notes TEXT
);
```

### Predefined Categories

**Income:**
- 💰 Пополнения / Deposits
- 📈 Прочие доходы / Other Income

**Food & Dining:**
- 🥐 Завтрак / Breakfast
- 🍽️ Обед / Lunch
- 🍴 Ужин / Dinner
- 🛒 Продукты / Groceries
- 🎉 Посиделки / Social Gatherings

**Transportation:**
- ⛽ Топлива / Fuel
- 🚗 Авто / Auto Maintenance
- 🚨 Авто штрафы / Auto Fines
- 🧼 Мойка / Car Wash
- 🚕 Такси / Taxi

**Personal Care:**
- ✂️ Барбер / Barber
- 💄 Косметика / Cosmetics
- 💊 Аптека / Pharmacy

**Housing:**
- 🏠 Ипотека / Mortgage
- 🏡 Дом / Home
- 💡 Коммукалка / Utilities

**Entertainment:**
- 💨 Кальян / Hookah
- 🍷 Алькоголь / Alcohol
- ✈️ Тур / Отдых / Vacation

**Shopping:**
- 👕 Одежда / Clothing
- 📱 Техника / Electronics
- 🎁 Подарки / Gifts

**Services:**
- 📱 Подписки / Subscriptions
- 👨‍⚕️ Доктор / Doctor
- 📋 Сборы / Fees
- 🚶 Уличный расходы / Street Expenses
- 📊 Инвестиция / Investment

---

## API Specifications

### Base URL
```
Production: https://api.expensecontrol.uz/v1
Staging: https://api-staging.expensecontrol.uz/v1
```

### Authentication Endpoints

#### POST /auth/send-code
Send verification code to phone number.

**Request:**
```json
{
  "phoneNumber": "+998912345678",
  "purpose": "registration"  // or "login"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Verification code sent",
  "expiresIn": 300,  // seconds
  "codeSentVia": "sms"  // or "whatsapp"
}
```

#### POST /auth/verify-code
Verify code and create/authenticate user.

**Request:**
```json
{
  "phoneNumber": "+998912345678",
  "code": "123456",
  "purpose": "registration",
  "deviceInfo": {
    "deviceId": "uuid-device-id",
    "deviceType": "ios",  // or "android", "web"
    "deviceName": "iPhone 13",
    "appVersion": "1.0.0"
  }
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "phoneNumber": "+998912345678",
    "name": null,
    "language": "ru",
    "primaryCurrency": "UZS"
  },
  "tokens": {
    "accessToken": "jwt-access-token",
    "refreshToken": "jwt-refresh-token",
    "expiresIn": 900  // seconds
  }
}
```

#### POST /auth/refresh-token
Refresh access token.

**Request:**
```json
{
  "refreshToken": "jwt-refresh-token"
}
```

**Response:**
```json
{
  "accessToken": "new-jwt-access-token",
  "expiresIn": 900
}
```

#### POST /auth/logout
Logout and revoke refresh token.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request:**
```json
{
  "allDevices": false  // true to logout from all devices
}
```

### Transaction Endpoints

#### GET /transactions
Get user transactions with pagination and filters.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Query Parameters:**
```
?page=1
&limit=20
&startDate=2026-02-01
&endDate=2026-02-29
&type=expense
&categoryId=uuid
&minAmount=1000
&maxAmount=1000000
&currency=UZS
&search=lunch
&sortBy=date
&sortOrder=desc
```

**Response:**
```json
{
  "transactions": [
    {
      "id": "uuid",
      "date": "2026-02-04",
      "amount": 37700,
      "currency": "UZS",
      "type": "expense",
      "category": {
        "id": "uuid",
        "nameRu": "Обед",
        "nameEn": "Lunch",
        "icon": "🍽️",
        "color": "#FF6B6B"
      },
      "description": "Lunch at restaurant",
      "receiptUrl": "https://...",
      "createdAt": "2026-02-04T15:30:00Z"
    }
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "pages": 8
  },
  "summary": {
    "totalIncome": 145800000,
    "totalExpense": 127700000,
    "netSavings": 18100000,
    "currency": "UZS"
  }
}
```

#### POST /transactions
Create new transaction.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request:**
```json
{
  "date": "2026-02-04",
  "amount": 50000,
  "currency": "UZS",
  "type": "expense",
  "categoryId": "uuid",
  "description": "Coffee with friends",
  "receiptUrl": "https://...",  // optional
  "tags": ["social", "coffee"],  // optional
  "deviceId": "uuid-device-id"
}
```

**Response:**
```json
{
  "id": "uuid",
  "date": "2026-02-04",
  "amount": 50000,
  "currency": "UZS",
  "type": "expense",
  "category": { ... },
  "description": "Coffee with friends",
  "createdAt": "2026-02-04T16:00:00Z"
}
```

#### PUT /transactions/:id
Update transaction.

#### DELETE /transactions/:id
Soft delete transaction.

### Budget Endpoints

#### GET /budgets/:month
Get budgets for specific month.

**Example:** `/budgets/2026-02`

**Response:**
```json
{
  "month": "2026-02-01",
  "overallBudget": {
    "amount": 128000000,
    "spent": 108800000,
    "remaining": 19200000,
    "percentage": 85,
    "currency": "UZS"
  },
  "categoryBudgets": [
    {
      "category": {
        "id": "uuid",
        "nameRu": "Ипотека",
        "nameEn": "Mortgage"
      },
      "budgetAmount": 27700000,
      "spentAmount": 27700000,
      "remainingAmount": 0,
      "percentage": 100,
      "status": "exceeded"  // or "onTrack", "warning"
    }
  ]
}
```

#### POST /budgets
Create or update budget.

```json
{
  "month": "2026-03",
  "categoryId": "uuid",  // null for overall
  "amount": 6000000,
  "currency": "UZS",
  "notes": "Increased due to inflation"
}
```

### Analytics Endpoints

#### GET /analytics/dashboard
Dashboard summary.

**Response:**
```json
{
  "period": "2026-02",
  "income": 145800000,
  "expenses": 127700000,
  "netSavings": 18100000,
  "savingsRate": 12.4,
  "budgetAdherence": 85,
  "topCategories": [
    {
      "category": { ... },
      "amount": 27700000,
      "percentage": 21.68,
      "transactionCount": 3
    }
  ],
  "comparisonToPreviousMonth": {
    "income": { amount: 132000000, change: 10.5 },
    "expenses": { amount: 134500000, change: -5.0 }
  }
}
```

#### GET /analytics/category-breakdown
Expense breakdown by category.

#### GET /analytics/trends
Historical trends (6-12 months).

---

## Mobile Application Specifications

### iOS App (Swift + SwiftUI)

**Minimum Requirements:**
- iOS 14.0+
- iPhone 8 and later
- 50 MB app size

**Project Structure:**
```
ExpenseControl/
├── App/
│   ├── ExpenseControlApp.swift
│   └── AppDelegate.swift
├── Core/
│   ├── Network/
│   │   ├── APIClient.swift
│   │   ├── Endpoints.swift
│   │   └── NetworkError.swift
│   ├── Storage/
│   │   ├── CoreDataStack.swift
│   │   ├── Models.xcdatamodeld
│   │   └── UserDefaults+Extensions.swift
│   └── Security/
│       ├── KeychainManager.swift
│       └── BiometricAuth.swift
├── Features/
│   ├── Auth/
│   │   ├── Views/
│   │   ├── ViewModels/
│   │   └── Models/
│   ├── Dashboard/
│   ├── Transactions/
│   ├── Budget/
│   └── Analytics/
├── Shared/
│   ├── Components/
│   ├── Extensions/
│   └── Utilities/
└── Resources/
    ├── Localizable.strings (ru, en)
    ├── Assets.xcassets
    └── Info.plist
```

**Key Dependencies:**
```swift
dependencies: [
    .package(url: "Alamofire", from: "5.8.0"),
    .package(url: "Kingfisher", from: "7.10.0"),
    .package(url: "Charts", from: "5.0.0"),
    .package(url: "firebase-ios-sdk", from: "10.20.0")
]
```

**Core Data Model:**
```swift
// Transaction Entity
@NSManaged public var id: UUID
@NSManaged public var date: Date
@NSManaged public var amount: Decimal
@NSManaged public var currency: String
@NSManaged public var type: String
@NSManaged public var category: Category
@NSManaged public var transactionDescription: String?
@NSManaged public var synced: Bool
@NSManaged public var createdAt: Date
```

**Offline Sync Strategy:**
```swift
class SyncManager {
    func syncTransactions() async throws {
        // 1. Fetch unsynced local transactions
        let unsynced = try fetchUnsyncedTransactions()
        
        // 2. Upload to server
        for transaction in unsynced {
            try await api.createTransaction(transaction)
            transaction.synced = true
        }
        
        // 3. Download new transactions from server
        let serverTransactions = try await api.getTransactions(
            since: lastSyncDate
        )
        
        // 4. Merge with local database (conflict resolution)
        try mergeTransactions(serverTransactions)
        
        // 5. Update last sync timestamp
        UserDefaults.lastSyncDate = Date()
    }
}
```

### Android App (Kotlin + Jetpack Compose)

**Minimum Requirements:**
- Android 8.0 (API 26)+
- 50 MB app size

**Project Structure:**
```
app/
├── src/main/
│   ├── java/uz/expensecontrol/
│   │   ├── ExpenseControlApp.kt
│   │   ├── di/  (Hilt modules)
│   │   ├── data/
│   │   │   ├── local/
│   │   │   │   ├── dao/
│   │   │   │   ├── entities/
│   │   │   │   └── ExpenseDatabase.kt
│   │   │   ├── remote/
│   │   │   │   ├── api/
│   │   │   │   └── dto/
│   │   │   └── repository/
│   │   ├── domain/
│   │   │   ├── model/
│   │   │   ├── repository/
│   │   │   └── usecase/
│   │   ├── presentation/
│   │   │   ├── auth/
│   │   │   ├── dashboard/
│   │   │   ├── transactions/
│   │   │   ├── budget/
│   │   │   └── analytics/
│   │   └── utils/
│   └── res/
│       ├── values/
│       │   ├── strings.xml
│       │   ├── strings-ru.xml
│       │   └── colors.xml
│       ├── drawable/
│       └── mipmap/
└── build.gradle.kts
```

**Room Database:**
```kotlin
@Entity(tableName = "transactions")
data class TransactionEntity(
    @PrimaryKey val id: String = UUID.randomUUID().toString(),
    val userId: String,
    val date: LocalDate,
    val amount: BigDecimal,
    val currency: String,
    val type: TransactionType,
    val categoryId: String,
    val description: String?,
    val synced: Boolean = false,
    val createdAt: Instant = Instant.now()
)

@Dao
interface TransactionDao {
    @Query("SELECT * FROM transactions WHERE synced = 0")
    suspend fun getUnsyncedTransactions(): List<TransactionEntity>
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTransaction(transaction: TransactionEntity)
    
    @Query("SELECT * FROM transactions WHERE date BETWEEN :start AND :end")
    fun getTransactionsByDateRange(start: LocalDate, end: LocalDate): Flow<List<TransactionEntity>>
}
```

### Push Notifications

**Firebase Cloud Messaging Setup:**

**Notification Types:**
```typescript
enum NotificationType {
  BUDGET_ALERT_80 = 'budget_alert_80',
  BUDGET_ALERT_100 = 'budget_alert_100',
  BUDGET_ALERT_120 = 'budget_alert_120',
  RECURRING_CREATED = 'recurring_created',
  DEBT_REMINDER = 'debt_reminder',
  DAILY_SUMMARY = 'daily_summary',
  SYNC_FAILED = 'sync_failed'
}
```

**iOS (Swift):**
```swift
func userNotificationCenter(
    _ center: UNUserNotificationCenter,
    didReceive response: UNNotificationResponse
) {
    let userInfo = response.notification.request.content.userInfo
    
    if let type = userInfo["type"] as? String,
       let data = userInfo["data"] as? [String: Any] {
        handleNotification(type: type, data: data)
    }
}

func handleNotification(type: String, data: [String: Any]) {
    switch type {
    case "budget_alert_100":
        // Navigate to budget screen
        break
    case "recurring_created":
        // Navigate to transaction detail
        break
    default:
        break
    }
}
```

**Android (Kotlin):**
```kotlin
class ExpenseFirebaseMessaging : FirebaseMessagingService() {
    override fun onMessageReceived(message: RemoteMessage) {
        message.data.let { data ->
            val type = data["type"]
            val notificationData = data["data"]
            
            when (type) {
                "budget_alert_100" -> showBudgetAlert(notificationData)
                "recurring_created" -> showRecurringNotification(notificationData)
            }
        }
    }
}
```

---

## Implementation Roadmap

### Phase 1: Foundation (Weeks 1-6)

**Week 1-2: Infrastructure**
- [ ] Git repository setup (monorepo)
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Cloud infrastructure (AWS/DO)
- [ ] PostgreSQL + Redis setup
- [ ] S3 storage configuration
- [ ] Sentry error tracking

**Week 3-4: Backend Core**
- [ ] Database schema + migrations
- [ ] Authentication API
  - [ ] Phone validation
  - [ ] SMS integration (Twilio)
  - [ ] JWT implementation
- [ ] User management API
- [ ] Transaction CRUD API

**Week 5-6: Web App Core**
- [ ] React + TypeScript setup
- [ ] Authentication UI
- [ ] Dashboard layout
- [ ] Transaction list
- [ ] Add/Edit transaction form

**Deliverables:**
✅ Working auth system  
✅ Basic transaction management  
✅ Deployed to staging  
✅ API documentation (Swagger)

### Phase 2: Mobile Apps (Weeks 7-12)

**Week 7-8: iOS App**
- [ ] Xcode project setup
- [ ] Core Data + Keychain
- [ ] Authentication flow
- [ ] Dashboard screen
- [ ] Transaction list/add

**Week 9-10: Android App**
- [ ] Android Studio setup
- [ ] Room + DataStore
- [ ] Authentication flow
- [ ] Dashboard screen
- [ ] Transaction list/add

**Week 11-12: Categories & Sync**
- [ ] Category management
- [ ] Offline sync logic
- [ ] Push notifications setup
- [ ] Receipt capture

**Deliverables:**
✅ iOS beta app  
✅ Android beta app  
✅ Offline mode working  
✅ Basic notifications

### Phase 3: Budget & Analytics (Weeks 13-17)

**Week 13-14: Budget System**
- [ ] Budget API
- [ ] Budget UI (all platforms)
- [ ] Alert notifications
- [ ] Recommendations engine

**Week 15-16: Analytics**
- [ ] Analytics API
- [ ] Dashboard widgets
- [ ] Charts (pie, bar, line)
- [ ] Export to PDF/Excel

**Week 17: Recurring**
- [ ] Recurring templates API
- [ ] Scheduled jobs
- [ ] UI for setup/manage

**Deliverables:**
✅ Complete budget system  
✅ Analytics dashboard  
✅ Data visualization  
✅ Recurring automation

### Phase 4: Advanced Features (Weeks 18-21)

**Week 18-19: Debt & Currency**
- [ ] Debt management
- [ ] Exchange rate API
- [ ] Multi-currency UI

**Week 20: Import/Export**
- [ ] Excel import wizard
- [ ] PDF export
- [ ] Scheduled reports

**Week 21: Polish & Testing**
- [ ] Bilingual completion
- [ ] Performance optimization
- [ ] Security audit
- [ ] Beta testing

**Deliverables:**
✅ All features complete  
✅ Security hardened  
✅ Performance optimized  
✅ Ready for production

### Phase 5: Launch (Weeks 22-24)

**Week 22: App Store Submission**
- [ ] iOS App Store submission
- [ ] Android Play Store submission
- [ ] Marketing materials

**Week 23: Production Deploy**
- [ ] Production infrastructure
- [ ] Database migration
- [ ] Load testing
- [ ] Monitoring setup

**Week 24: Launch**
- [ ] Public launch
- [ ] User onboarding
- [ ] Support setup
- [ ] Analytics tracking

---

## Testing Strategy

### Unit Testing
- Backend: Jest (80% coverage target)
- iOS: XCTest
- Android: JUnit + Mockito

### Integration Testing
- API: Supertest
- Database: Test containers

### E2E Testing
- Web: Cypress
- Mobile: Appium or Detox

### Performance Testing
- Load testing: k6
- Database: pgbench
- Mobile: Xcode Instruments / Android Profiler

---

## Deployment Strategy

### Environments
```
Development → Staging → Production
```

### Blue-Green Deployment
```
┌─────────────┐
│ Load Balancer│
└──────┬──────┘
       │
   ┌───┴───┐
   │       │
┌──┴──┐ ┌──┴──┐
│Blue │ │Green│
│v1.0 │ │v1.1 │
└─────┘ └─────┘
```

### Rollback Plan
- Keep previous version running
- Quick switch via load balancer
- Database migrations reversible
- Feature flags for gradual rollout

---

## Monitoring & Observability

### Metrics
- Request rate, error rate, latency (p50, p95, p99)
- Database query performance
- Cache hit ratio
- API endpoint performance

### Logging
- Structured logging (JSON)
- Log levels: ERROR, WARN, INFO, DEBUG
- Centralized: CloudWatch or Datadog

### Alerts
- Error rate > 5%
- Response time > 2s (p95)
- Database connection pool > 80%
- Disk usage > 85%
- Memory usage > 90%

### Dashboards
- Real-time user activity
- API performance
- Database metrics
- Mobile app crashes

---

## Cost Estimation

### Monthly Operating Costs (estimated)

**Infrastructure:**
- Servers (2x): $40-80
- Database: $15-30
- Redis: $10-20
- S3 Storage: $5-10
- CDN: $10-20

**Services:**
- Twilio (SMS): $0.05/SMS × 1000 users = $50
- Firebase: Free tier (under 10k users)
- Monitoring: $20-50
- Domain + SSL: $3

**Total:** ~$150-300/month (1000 active users)

**Scaling:** Add $100-200 per 1000 additional users

---

## Glossary

| Term | Definition |
|------|------------|
| API | Application Programming Interface |
| CRUD | Create, Read, Update, Delete |
| JWT | JSON Web Token |
| ORM | Object-Relational Mapping |
| PWA | Progressive Web App |
| SMS | Short Message Service |
| UUID | Universally Unique Identifier |
| i18n | Internationalization |

---

## Appendix

### Example API Request (cURL)

```bash
# Send verification code
curl -X POST https://api.expensecontrol.uz/v1/auth/send-code   -H "Content-Type: application/json"   -d '{"phoneNumber": "+998912345678", "purpose": "login"}'

# Create transaction
curl -X POST https://api.expensecontrol.uz/v1/transactions   -H "Authorization: Bearer {token}"   -H "Content-Type: application/json"   -d '{
    "date": "2026-02-04",
    "amount": 50000,
    "currency": "UZS",
    "type": "expense",
    "categoryId": "uuid",
    "description": "Lunch"
  }'
```

### Environment Variables

```bash
# Backend
DATABASE_URL=postgresql://user:pass@localhost:5432/expensedb
REDIS_URL=redis://localhost:6379
JWT_ACCESS_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=expense-receipts
FIREBASE_ADMIN_SDK=...
SENTRY_DSN=https://...

# Frontend
VITE_API_URL=https://api.expensecontrol.uz/v1
VITE_FIREBASE_CONFIG=...
```

---

**End of Technical Specification**

For questions or clarifications, contact: dev@expensecontrol.uz
