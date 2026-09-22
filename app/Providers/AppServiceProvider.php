<?php

namespace App\Providers;

use App\Models\User;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Schema;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);
        Schema::defaultStringLength(191);

        Gate::define('view', fn (User $user) => $user->hasManagerPermission('view'));
        Gate::define('create', fn (User $user) => $user->hasManagerPermission('create'));
        Gate::define('update', fn (User $user) => $user->hasManagerPermission('update'));
        Gate::define('delete', fn (User $user) => $user->hasManagerPermission('delete'));
    }
}