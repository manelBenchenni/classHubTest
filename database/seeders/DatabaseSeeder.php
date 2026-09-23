<?php

namespace Database\Seeders;

use App\Enums\AttendanceStatus;
use App\Enums\Role;
use App\Enums\UserStatus;
use App\Models\Attendance;
use App\Models\ManagerPermission;
use App\Models\Room;
use App\Models\Schedule;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /** Fixed demo password for every seeded account — documented in the README. */
    private const DEMO_PASSWORD = 'Password123!';

    private const SUBJECTS = ['Mathematics', 'Physics', 'English', 'Computer Science', 'Chemistry', 'Biology', 'History', 'Economics'];

    /** Mon–Fri, 5 time slots a day. Kept short (1h30) so nothing spills past a normal school day. */
    private const TIME_SLOTS = [
        ['08:00', '09:30'],
        ['09:30', '11:00'],
        ['11:00', '12:30'],
        ['14:00', '15:30'],
        ['15:30', '17:00'],
    ];

    public function run(): void
    {
        $principal = $this->seedPrincipalManager();
        $this->seedSecondaryManagers();
        $rooms = $this->seedRooms();
        $teachers = $this->seedTeachers();
        $students = $this->seedStudents($rooms);
        $schedules = $this->seedSchedules($rooms, $teachers);
        $this->seedAttendanceHistory($schedules);
        $this->seedPendingRegistrations();

        $this->command->info('Seeding complete.');
        $this->command->info('Principal manager: '.$principal->email.' / '.self::DEMO_PASSWORD);
    }

    private function seedPrincipalManager(): User
    {
        return User::create([
            'name' => 'Manel BenChenni',
            'email' => 'manelmbenchenni@gmail.com',
            'password' => Hash::make("password 123"),
            'role' => Role::PrincipalManager,
            'status' => UserStatus::Active,
            'must_change_password' => false,
            'email_verified_at' => now(),
        ]);
    }

    private function seedSecondaryManagers(): void
    {
        $full = User::create([
            'name' => 'Karim Haddad',
            'email' => 'benchennimanel59@gmail.com',
            'password' => Hash::make(self::DEMO_PASSWORD),
            'role' => Role::SecondaryManager,
            'status' => UserStatus::Active,
            'must_change_password' => false,
            'email_verified_at' => now(),
        ]);

        ManagerPermission::create([
            'user_id' => $full->id,
            'can_view' => true,
            'can_create' => true,
            'can_update' => true,
            'can_delete' => true,
        ]);

        // Deliberately different permission set, so the two secondary managers
        // are distinguishable when testing (point 14 of the subject).
        $limited = User::create([
            'name' => 'Sofia Meziane',
            'email' => 'manager.limited@classhub.test',
            'password' => Hash::make(self::DEMO_PASSWORD),
            'role' => Role::SecondaryManager,
            'status' => UserStatus::Active,
            'must_change_password' => false,
            'email_verified_at' => now(),
        ]);

        ManagerPermission::create([
            'user_id' => $limited->id,
            'can_view' => true,
            'can_create' => true,
            'can_update' => false,
            'can_delete' => false,
        ]);
    }

    private function seedRooms(): \Illuminate\Support\Collection
    {
        $names = ['Room A1', 'Room A2', 'Room B1', 'Room B2', 'Room C1', 'Room C2'];

        return collect($names)->map(fn ($name) => Room::create([
            'name' => $name,
            'capacity' => 30,
        ]));
    }

    private function seedTeachers(): \Illuminate\Support\Collection
    {
        return collect(range(1, 8))->map(fn ($i) => User::create([
            'name' => "Teacher {$i}",
            'email' => "teacher{$i}@classhub.test",
            'password' => Hash::make(self::DEMO_PASSWORD),
            'role' => Role::Teacher,
            'status' => UserStatus::Active,
            'must_change_password' => false,
            'email_verified_at' => now(),
        ]));
    }

    private function seedStudents(\Illuminate\Support\Collection $rooms): \Illuminate\Support\Collection
    {
        $students = collect();
        $roomCount = $rooms->count();

        for ($i = 1; $i <= 150; $i++) {
            // Spread students evenly across rooms; 150 / 6 = 25 per room, under the 30 capacity.
            $room = $rooms[($i - 1) % $roomCount];

            $students->push(User::create([
                'name' => "Student {$i}",
                'email' => "student{$i}@classhub.test",
                'password' => Hash::make(self::DEMO_PASSWORD),
                'role' => Role::Student,
                'status' => UserStatus::Active,
                'must_change_password' => false,
                'room_id' => $room->id,
                'email_verified_at' => now(),
            ]));
        }

        return $students;
    }

    /**
     * Builds a full Mon–Fri week with zero conflicts by construction: for a
     * given (day, time slot), at most one teacher is assigned per room, and
     * teachers are picked via a rotating offset so the same 6 (of 8) teachers
     * are never double-booked across rooms at the same time.
     */
    private function seedSchedules(\Illuminate\Support\Collection $rooms, \Illuminate\Support\Collection $teachers): \Illuminate\Support\Collection
    {
        $schedules = collect();
        $teacherCount = $teachers->count();
        $roomCount = $rooms->count();
        $slotOffset = 0;

        foreach (range(1, 5) as $day) { // 1 = Monday ... 5 = Friday
            foreach (self::TIME_SLOTS as [$start, $end]) {
                foreach ($rooms as $roomIndex => $room) {
                    $teacher = $teachers[($slotOffset + $roomIndex) % $teacherCount];
                    $subject = self::SUBJECTS[($slotOffset + $roomIndex) % count(self::SUBJECTS)];

                    $schedules->push(Schedule::create([
                        'room_id' => $room->id,
                        'teacher_id' => $teacher->id,
                        'subject' => $subject,
                        'day_of_week' => $day,
                        'start_time' => $start,
                        'end_time' => $end,
                    ]));
                }

                $slotOffset++; // rotate so teachers vary across the week rather than repeating the same room/teacher pair
            }
        }

        return $schedules;
    }

    /**
     * Two weeks of attendance, generated only for the days that actually fall
     * on a schedule's weekday within that range — so every record matches a
     * real past session, as the attendance rules require.
     */
    private function seedAttendanceHistory(\Illuminate\Support\Collection $schedules): void
    {
        $schedulesByDay = $schedules->groupBy('day_of_week');
        $today = Carbon::today();

        for ($daysAgo = 1; $daysAgo <= 14; $daysAgo++) {
            $date = $today->copy()->subDays($daysAgo);
            $daySchedules = $schedulesByDay->get($date->isoWeekday(), collect());

            foreach ($daySchedules as $schedule) {
                $students = User::where('room_id', $schedule->room_id)->get();

                foreach ($students as $student) {
                    Attendance::create([
                        'schedule_id' => $schedule->id,
                        'student_id' => $student->id,
                        'date' => $date->toDateString(),
                        // ~90% attendance rate, enough absences to make the F6
                        // "notify after 3 absences" bonus meaningful to test.
                        'status' => random_int(1, 10) <= 9 ? AttendanceStatus::Present : AttendanceStatus::Absent,
                        'marked_by' => $schedule->teacher_id,
                    ]);
                }
            }
        }
    }

    private function seedPendingRegistrations(): void
    {
        foreach (range(1, 5) as $i) {
            $role = $i % 2 === 0 ? Role::Teacher : Role::Student;

            User::create([
                'name' => "Pending Applicant {$i}",
                'email' => "pending{$i}@classhub.test",
                'password' => Hash::make(self::DEMO_PASSWORD),
                'role' => $role,
                'status' => UserStatus::Pending,
                'must_change_password' => false,
            ]);
        }
    }
}