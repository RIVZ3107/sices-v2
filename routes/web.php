<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::view('/login', 'app')->name('login');
Route::view('/app/{any?}', 'app')->where('any', '.*');
