# ClassHub — Training School Management System

A Laravel technical test: a training school platform managing users, rooms, teachers, students, weekly schedules, attendance, and real-time notifications, with three role levels (Principal Manager, Secondary Manager, Teacher, Student) and permission-scoped access.

---

## 1. Stack & why

| Layer | Choice | Why |
|---|---|---|
| Backend | Laravel 11, PHP 8.2+ | Required by the spec |
| Database | MySQL | Required by the spec |
| Frontend | Inertia.js + React (Breeze starter kit) | Full-page SPA feel without building a separate API; Breeze gives auth scaffolding (registration, login, password reset) out of the box, which was extended for role-based accounts rather than replaced |
| Authorization | Laravel Gates + a custom `manager_permissions` table | The spec's permission model (view/create/update/delete, per secondary manager) doesn't map cleanly onto `spatie/laravel-permission`'s role/ability structure, so a dedicated one-row-per-secondary-manager table with four booleans was simpler and easier to reason about than introducing an external package for four flags |
| Real-time | Laravel Reverb (self-hosted WebSocket server, Pusher-protocol compatible) | Required by the spec; avoids a third-party dependency like Pusher Cloud |
| Emails | Laravel Mail + database queue, tested with Mailpit | Keeps HTTP responses fast; Mailpit gives a local inbox with zero external config |
| Queue | Database driver | Simplest to set up and inspect for a project this size; no Redis dependency required |

---

## 2. Roles & permission model

Four roles, stored as a MySQL `enum` column and mirrored by a PHP backed enum (`App\Enums\Role`) so comparisons are type-safe:

- **`principal_manager`** — full access to everything. Bypasses the permission table entirely (see `User::hasManagerPermission()`).
- **`secondary_manager`** — access is entirely defined by their row in `manager_permissions` (`can_view`, `can_create`, `can_update`, `can_delete`). A secondary manager with no row, or with all flags `false`, can reach their dashboard but nothing else. A secondary manager can never manage another secondary manager's account or the principal's account, regardless of their permission flags — only the principal manager can.
- **`teacher`** — scoped to their own schedule slots and the rooms tied to those slots.
- **`student`** — read-only: their own room, their room's schedule, their own absence history.

### How authorization is enforced

Four Laravel Gates (`view`, `create`, `update`, `delete`) are defined in `AppServiceProvider::boot()`, each delegating to `User::hasManagerPermission(string $permission)`:

```php
public function hasManagerPermission(string $permission): bool
{
    if ($this->isPrincipalManager()) {
        return true;
    }

    return (bool) $this->permissions?->{"can_{$permission}"};
}
```

Every manager-side controller action calls `Gate::authorize(...)` before doing anything else. This is backed up, not replaced, by row-level ownership checks (a secondary manager editing another secondary manager, or the principal's account, is blocked even if their Gate check would otherwise pass) — see `UserController::update()`/`destroy()`.

The frontend also reads the same `hasManagerPermission()` result (shared via `HandleInertiaRequests::share()` as `auth.user.can.{view,create,update,delete}`) so a `view`-only secondary manager never even sees a Create/Edit/Delete button — but this is a UX convenience only; the server-side Gate is the actual boundary.

---

## 3. Key design decisions

#### Deleting a room

A room that still has students assigned cannot be deleted: the manager gets an
error message and must first move those students to another room.

If the room has no students, it is **soft-deleted**. Its schedules and attendance
history stay in the database untouched, so past records keep their integrity and
reports on historical data stay correct. The room disappears from the active list
but is never physically removed.

Why: deleting a room is rarely a reason to lose the attendance history tied to it,
and blocking on students alone prevents leaving students without a room.

### Weekly schedule recap email
Sent via a scheduled Artisan command (`php artisan classhub:send-weekly-recaps`), not triggered on schedule creation. This guarantees **exactly one email per teacher per week**, listing every slot they have, rather than one email per slot created — the command is scheduled to run every Monday at 06:00 via `routes/console.php` (`Schedule::command(...)->weekly()->mondays()->at('06:00')`).

### Public registration & approval
A self-registered teacher or student is created with `status = pending` and cannot log in (enforced by `EnsureUserIsActive` middleware, which checks status on every authenticated request — not just at login — so a session opened before an account is disabled/rejected is also cut off mid-session). A manager can accept (→ `active`, with an activation email) or reject (→ `rejected`, account retained for audit but permanently unable to log in) a pending account.

### Forced password change
Any account created by a manager gets a random 12-character temporary password (emailed via a queued `WelcomeEmail`) and `must_change_password = true`. A dedicated middleware intercepts every authenticated request except the password-change page itself and redirects there until the user sets a real password.

### Schedule conflict detection
A new or edited schedule slot is validated server-side for two independent overlap conditions — same teacher, same day, overlapping time; same room, same day, overlapping time — using a strict interval-overlap comparison (`start_time < other.end_time AND end_time > other.start_time`), so a partial overlap is correctly treated as a conflict, not just an exact time match.

### Attendance rules
Enforced entirely server-side in `Teacher\AttendanceController::store()`:
- A teacher can only mark attendance for their own schedule slots (`$teacher->teachingSchedules()->findOrFail(...)` — a 404, not a 403, if it isn't theirs).
- Only for students actually assigned to that slot's room.
- Never for a future date.
- Same-day correction only (re-submitting the same date overwrites via `updateOrCreate`, which also naturally enforces the one-record-per-student-per-session-per-date rule from the database's unique constraint).

### Real-time notifications
Built on Laravel's built-in notification system (`database` + `broadcast` channels) rather than a bespoke solution, broadcasting over private per-user Reverb channels (`App.Models.User.{id}`, authorized in `routes/channels.php` to only that user). Four triggers implemented:
- New pending registration → all managers (principal + secondary)
- Schedule created/modified → the assigned teacher
- Room assignment → the student
- Absence recorded → the student (only on `absent`, not on every attendance write)

Notifications persist in the `notifications` table (survive reload/re-login) and are also pushed live while the user is connected. A small JSON API (`NotificationController`) backs the unread counter and mark-as-read/mark-all-as-read actions from the frontend bell icon.

---

## 4. Prerequisites

- PHP 8.2+
- Composer
- Node.js + npm
- MySQL 8.0.16+ (or MariaDB 10.2+, for the CHECK constraints on the `schedules` table)
- [Mailpit](https://github.com/axllent/mailpit) (or any SMTP-compatible catcher) for local email testing

---

## 5. Installation

```bash
git clone https://github.com/manelBenchenni/classHubTest.git classhub
cd classhub

composer install
npm install

cp .env.example .env 
php artisan key:generate
```

### Database configuration

In `.env`:
```
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=classhub
DB_USERNAME=root
DB_PASSWORD=
```

### Email configuration (Mailpit)

```
MAIL_MAILER=smtp
MAIL_HOST=127.0.0.1
MAIL_PORT=1025
MAIL_ENCRYPTION=null
```
View sent emails at `http://127.0.0.1:8025`.

### Queue

```
QUEUE_CONNECTION=database
```

### Reverb (WebSockets)

```bash
php artisan reverb:install
```
This adds `REVERB_APP_ID`, `REVERB_APP_KEY`, `REVERB_APP_SECRET`, `REVERB_HOST`, `REVERB_PORT` to `.env` automatically. Also add the Vite-exposed mirrors so the frontend can read them:
```
VITE_REVERB_APP_KEY="${REVERB_APP_KEY}"
VITE_REVERB_HOST="${REVERB_HOST}"
VITE_REVERB_PORT="${REVERB_PORT}"
VITE_REVERB_SCHEME="${REVERB_SCHEME}"
```

### Migrate & seed

```bash
php artisan migrate
php artisan db:seed
```

The seeder produces:
- 1 principal manager
- 2 secondary managers, with different permission sets
- 8 teachers
- 150 students
- 6 rooms
- One full week of conflict-free schedules
- Two weeks of attendance history
- 5 pending registrations

---

## 6. Running the project

Five processes run in parallel during development, each in its own terminal:

```bash
php artisan serve          # HTTP server
npm run dev                # Vite (frontend assets)
php artisan queue:work     # processes queued emails & notification broadcasts
php artisan reverb:start   # WebSocket server for real-time notifications
php artisan schedule:work  # runs the weekly recap email on schedule (local dev equivalent of a cron entry)
```

To manually trigger the weekly recap email without waiting for Monday:
```bash
php artisan classhub:send-weekly-recaps
```

---

## 7. Test accounts

*(Update these to match whatever your `DatabaseSeeder` actually outputs before submitting — passwords below are placeholders.)*

| Role | Email | Password |
|---|---|---|
| Principal manager | `manelmbenchenni@gmail.com` | `Password123!` |
| Secondary manager (view/create only) | `benchennimanel59@gmail.com` | `Password123!` |
| Secondary manager (view/update/delete) | `secondary2@classhub.test` | `Password123!` |
| Teacher | `teacher1@classhub.test` | `Password123!` |
| Student | `student1@classhub.test` | `Password123!` |

---

## 8. Project structure highlights

```
app/
  Enums/              Role, UserStatus, AttendanceStatus — backed enums matching DB enum columns
  Http/
    Controllers/
      Auth/            Breeze auth, extended: role-validated registration, role-based post-login redirect
      Manager/          UserController, RoomController, ScheduleController, RoomAttendanceController, DashboardController
      Teacher/          DashboardController, AttendanceController
      Student/          DashboardController, AttendanceHistoryController, StudentAttendanceController.php
      NotificationController   JSON API for the notification bell (list, mark read, mark all read)
    Middleware/
      EnsureUserIsActive       blocks pending/rejected/disabled accounts, including already-open sessions
      EnsureUserHasRole        role-gates a route group
      (must_change_password middleware)   forces the password-change flow for temp-password accounts
  Models/               User, Room, Schedule, Attendance, ManagerPermission — with relationships, casts, $fillable
  Notifications/        NewRegistrationPending, ScheduleChanged, RoomAssigned, AbsenceRecorded
  Mail/                 WelcomeEmail, AccountActivatedMail, WeeklyScheduleRecap, RoomAssignedMail.php
  Console/Commands/     SendWeeklyScheduleRecaps
routes/
  manager.php, teacher.php, student.php, channels.php, web.php
resources/js/
  Layouts/              ManagerLayout, TeacherLayout, StudentLayout , AuthenticatedLayout, GuessLayout(these two layout are by default from breeze)
  Pages/                Inertia pages per role
  echo.js                Laravel Echo + Reverb client setup
```

---

## 9. Known limitations / not implemented
i had limitations in my pc i couldnt make docker file cause i have a problem in my pc the ram capacity couldnt run the docker also i didnt take the risk to make a docker-compose havent tested before , and for alert and pdf export i finished on time (deadline) i didnt want to take a risk to add a new feature which may has a bugs and destroy the system 

---

## 10. Approximate time spent

17 heurs
