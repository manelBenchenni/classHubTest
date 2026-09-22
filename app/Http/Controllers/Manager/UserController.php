<?php

namespace App\Http\Controllers\Manager;

use App\Enums\Role;
use App\Enums\UserStatus;
use App\Http\Controllers\Controller;
use App\Mail\AccountActivatedMail;
use App\Mail\WelcomeEmail;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\Room;


class UserController extends Controller
{
 public function index(Request $request): Response
{
    Gate::authorize('view');

    $users = User::query()
        ->with('room:id,name,capacity')
        ->when(! $request->user()->isPrincipalManager(), fn ($q) =>
            $q->where('role', '!=', Role::PrincipalManager->value)
        )
        ->when($request->search, fn ($q, $search) =>
            $q->where(fn ($q) => $q
                ->where('name', 'like', "%{$search}%")
                ->orWhere('email', 'like', "%{$search}%")
            )
        )
        ->when($request->role, fn ($q, $role) => $q->where('role', $role))
        ->when($request->status, fn ($q, $status) => $q->where('status', $status))
        ->latest()
        ->paginate(15)
        ->withQueryString();

    return Inertia::render('Manager/Users/Index', [
        'users' => $users,
        'filters' => $request->only(['search', 'role', 'status']),
        'rooms' => Room::withCount('students')->orderBy('name')->get(['id', 'name', 'capacity']),
    ]);
}

    public function store(Request $request): RedirectResponse
{
    Gate::authorize('create');

    $validated = $request->validate([
        'name' => ['required', 'string', 'max:255'],
        'email' => ['required', 'email', 'max:255', 'unique:users,email'],
        'role' => ['required', Rule::in([
            Role::SecondaryManager->value,
            Role::Teacher->value,
            Role::Student->value,
        ])],
        'can_view' => ['boolean'],
        'can_create' => ['boolean'],
        'can_update' => ['boolean'],
        'can_delete' => ['boolean'],
    ]);

    if ($validated['role'] === Role::SecondaryManager->value && ! $request->user()->isPrincipalManager()) {
        abort(403, 'Only the principal manager can create secondary managers.');
    }

    $temporaryPassword = Str::password(12);

    $user = User::create([
        'name' => $validated['name'],
        'email' => $validated['email'],
        'password' => Hash::make($temporaryPassword),
        'role' => $validated['role'],
        'status' => UserStatus::Active,
        'must_change_password' => true,
    ]);

    if ($validated['role'] === Role::SecondaryManager->value) {
        $user->permissions()->create([
            'can_view' => $validated['can_view'] ?? false,
            'can_create' => $validated['can_create'] ?? false,
            'can_update' => $validated['can_update'] ?? false,
            'can_delete' => $validated['can_delete'] ?? false,
        ]);
    }

    Mail::to($user)->queue(new WelcomeEmail($user, $temporaryPassword));

    return back()->with('status', "Account created for {$user->name}.");
}

 public function update(Request $request, User $user): RedirectResponse
{
    Gate::authorize('update');

    $actingUser = $request->user();

    if ($user->role === Role::PrincipalManager && ! $actingUser->is($user)) {
        abort(403, "You can't modify the principal manager's account.");
    }

    if ($user->role === Role::SecondaryManager
        && ! $actingUser->is($user)
        && ! $actingUser->isPrincipalManager()) {
        abort(403, 'Only the principal manager can manage secondary manager accounts.');
    }

    $validated = $request->validate([
        'name' => ['required', 'string', 'max:255'],
        'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
    ]);

    $user->update($validated);

    return back()->with('status', 'User updated.');
}

public function destroy(Request $request, User $user): RedirectResponse
{
    Gate::authorize('delete');

    if (! $request->user()->isPrincipalManager()) {
        abort(403, 'Only the principal manager can delete users.');
    }

    if ($user->role === Role::PrincipalManager) {
        abort(403, "The principal manager's account can't be deleted.");
    }

    $user->delete();

    return back()->with('status', 'User deleted.');
}

    public function accept(Request $request, User $user): RedirectResponse
    {
        Gate::authorize('update');

        if ($user->status !== UserStatus::Pending) {
            abort(422, 'Only pending accounts can be accepted.');
        }

        $user->update(['status' => UserStatus::Active]);

        Mail::to($user)->queue(new AccountActivatedMail($user));

        return back()->with('status', "{$user->name}'s account has been activated.");
    }

    public function reject(Request $request, User $user): RedirectResponse
    {
        Gate::authorize('update');

        if ($user->status !== UserStatus::Pending) {
            abort(422, 'Only pending accounts can be rejected.');
        }

        $user->update(['status' => UserStatus::Rejected]);

        // Keep the user in the database for audit purposes, but they can never
        // row (for audit) but can never sign in; status is checked on every
        // request by EnsureUserIsActive, which only allows Active through.
        return back()->with('status', "{$user->name}'s registration has been rejected.");
    }

    public function toggleStatus(Request $request, User $user): RedirectResponse
    {
        Gate::authorize('update');

        $actingUser = $request->user();

        if ($user->is($actingUser)) {
            abort(403, "You can't change your own status.");
        }

        if ($user->role === Role::PrincipalManager) {
            abort(403, "The principal manager's account can't be disabled.");
        }

        if ($user->isManager() && ! $actingUser->isPrincipalManager()) {
            abort(403, "Only the principal manager can change a manager's status.");
        }

        if (! in_array($user->status, [UserStatus::Active, UserStatus::Disabled], true)) {
            abort(422, 'Only active or disabled accounts can be toggled this way.');
        }

        $newStatus = $user->status === UserStatus::Active
            ? UserStatus::Disabled
            : UserStatus::Active;

        $user->update(['status' => $newStatus]);

        if ($newStatus === UserStatus::Disabled) {
            // Force out any session already open, don't wait for their next request
            DB::table('sessions')->where('user_id', $user->id)->delete();
        }

        return back()->with('status', "{$user->name} is now {$newStatus->value}.");
    }
}