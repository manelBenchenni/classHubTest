<?php

namespace App\Http\Controllers\Manager;

use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Models\Room;
use App\Models\Schedule;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class ScheduleController extends Controller
{
    public function index(): Response
    {
        Gate::authorize('view');

        return Inertia::render('Manager/Schedules/Index', [
            'schedules' => Schedule::with(['room:id,name', 'teacher:id,name'])
                ->orderBy('day_of_week')
                ->orderBy('start_time')
                ->get(),
            'rooms' => Room::orderBy('name')->get(['id', 'name']),
            'teachers' => User::where('role', Role::Teacher)->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        Gate::authorize('create');

        $validated = $this->validateSchedule($request);

        Schedule::create($validated);

        return back()->with('status', 'Schedule slot created.');
    }

    public function update(Request $request, Schedule $schedule): RedirectResponse
    {
        Gate::authorize('update');

        $validated = $this->validateSchedule($request, $schedule);

        $schedule->update($validated);

        return back()->with('status', 'Schedule slot updated.');
    }

    public function destroy(Schedule $schedule): RedirectResponse
    {
        Gate::authorize('delete');

        $schedule->delete(); // soft delete, attendance history stays intact

        return back()->with('status', 'Schedule slot deleted.');
    }

    /**
     * Shared by store() and update(). Validates the basic fields, then checks
     * that the teacher and the room have no overlapping slot on the same day.
     * A partial overlap counts as a conflict (point 4 of the subject).
     */
    private function validateSchedule(Request $request, ?Schedule $ignoring = null): array
    {
        $validated = $request->validate([
            'room_id' => ['required', 'exists:rooms,id'],
            'teacher_id' => ['required', 'exists:users,id', Rule::exists('users', 'id')->where('role', Role::Teacher->value)],
            'subject' => ['required', 'string', 'max:255'],
            'day_of_week' => ['required', 'integer', 'between:1,7'],
            'start_time' => ['required', 'date_format:H:i'],
            'end_time' => ['required', 'date_format:H:i', 'after:start_time'],
        ]);

        $overlaps = function (string $column, int $value) use ($validated, $ignoring): bool {
            return Schedule::where($column, $value)
                ->where('day_of_week', $validated['day_of_week'])
                ->when($ignoring, fn ($q) => $q->whereKeyNot($ignoring->id))
                ->where('start_time', '<', $validated['end_time'])
                ->where('end_time', '>', $validated['start_time'])
                ->exists();
        };

        if ($overlaps('teacher_id', $validated['teacher_id'])) {
            throw ValidationException::withMessages([
                'teacher_id' => 'This teacher already has a session that overlaps this time slot.',
            ]);
        }

        if ($overlaps('room_id', $validated['room_id'])) {
            throw ValidationException::withMessages([
                'room_id' => 'This room is already booked for an overlapping time slot.',
            ]);
        }

        return $validated;
    }
}