<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\AdminDocumentController;
use App\Http\Controllers\AdminRepositoryEntryController;
use App\Http\Controllers\RepositorySearchController;
use App\Http\Controllers\StudentDocumentController;
use App\Http\Controllers\StudentExpedientController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::get('/repository/search', [RepositorySearchController::class, 'index']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
    Route::get('/student/documents', [StudentDocumentController::class, 'index']);
    Route::post('/student/documents', [StudentDocumentController::class, 'store']);
    Route::get('/student/documents/{document}/file', [StudentDocumentController::class, 'download']);
    Route::get('/student/expedients', [StudentExpedientController::class, 'index']);
    Route::post('/student/expedients', [StudentExpedientController::class, 'store']);
    Route::post('/student/expedients/{expedient}/documents', [StudentDocumentController::class, 'storeForRequirement']);
    Route::get('/admin/documents', [AdminDocumentController::class, 'index']);
    Route::post('/admin/repository/entries', [AdminRepositoryEntryController::class, 'store']);
});