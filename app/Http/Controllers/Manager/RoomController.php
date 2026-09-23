<?php

namespace App\Http\Controllers\Manager;

use App\Enums\Role;
use App\Enums\UserStatus;
use App\Http\Controllers\Controller;
use App\Mail\RoomAssignedMail;
use App\Models\Room;
use App\Models\User;
use App\Notifications\RoomAssigned;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class RoomController extends Controller
{
    public function index(): Response
    {
        Gate::authorize('view');

        $rooms = Room::withCount('students')->orderBy('name')->paginate(15);

        return Inertia::render('Manager/Rooms/Index', [
            'rooms' => $rooms,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        Gate::authorize('create');

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:rooms,name'],
            'capacity' => ['required', 'integer', 'min:1', 'max:500'],
        ]);

        Room::create($validated);

        return back()->with('status', 'Room created.');
    }

    public function update(Request $request, Room $room): RedirectResponse
    {
        Gate::authorize('update');

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('rooms', 'name')->ignore($room->id)],
            'capacity' => ['required', 'integer', 'min:1', 'max:500'],
        ]);

        // Shrinking capacity below the current headcount would silently
        // break the "capacity never exceeded" rule, so it's blocked here.
        if ($validated['capacity'] < $room->students()->count()) {
            throw ValidationException::withMessages([
                'capacity' => 'Capacity can\'t be lower than the number of students currently in this room.',
            ]);
        }

        $room->update($validated);

        return back()->with('status', 'Room updated.');
    }

    public function destroy(Room $room): RedirectResponse
    {
        Gate::authorize('delete');

        // Design choice (documented in README): refuse deletion while the room
        // still holds students; otherwise soft-delete, which preserves its
        // schedules and attendance history intact.
        if ($room->students()->exists()) {
            throw ValidationException::withMessages([
                'room' => 'This room still has students assigned. Move them before deleting it.',
            ]);
        }

        $room->delete();

        return back()->with('status', 'Room deleted.');
    }

    /**
     * Assign or move a student to this room.
     */
    public function assignStudent(Request $request, Room $room): RedirectResponse
    {
        Gate::authorize('update'); // assignment counts as a modification (point 3.2)

        $validated = $request->validate([
            'student_id' => ['required', 'exists:users,id'],
        ]);

        DB::transaction(function () use ($room, $validated) {
            // Lock the room row so two simultaneous assignments can't both
            // pass the capacity check and overshoot it.
            $lockedRoom = Room::whereKey($room->id)->lockForUpdate()->firstOrFail();

            $student = User::whereKey($validated['student_id'])
                ->where('role', Role::Student)
                ->lockForUpdate()
                ->firstOrFail();

            if ($student->room_id === $lockedRoom->id) {
                return; // already in this room, nothing to do
            }

            $currentCount = User::where('room_id', $lockedRoom->id)->count();

            if ($currentCount >= $lockedRoom->capacity) {
                throw ValidationException::withMessages([
                    'student_id' => 'This room is at full capacity.',
                ]);
            }

            $student->update(['room_id' => $lockedRoom->id]);

            Mail::to($student)->queue(new RoomAssignedMail($student, $lockedRoom));
            $student->notify(new RoomAssigned($lockedRoom));
        });

        return back()->with('status', 'Student assigned.');
    }

    public function removeStudent(Room $room, User $student): RedirectResponse
    {
        Gate::authorize('update');

        if ($student->room_id !== $room->id) {
            abort(404);
        }

        $student->update(['room_id' => null]);

        return back()->with('status', 'Student removed from room.');
    }
}