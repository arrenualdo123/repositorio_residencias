<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $isInstitutional = str_ends_with(
            strtolower((string) $request->input('email')),
            '@lahuerta.tecmm.edu.mx',
        );

        $fields = $request->validate([
            'name'     => 'required|string',
            'email'    => 'required|string|email|unique:users,email',
            'password' => 'required|string|confirmed',
            'career_code' => [
                Rule::requiredIf($isInstitutional),
                'nullable',
                'string',
                Rule::in(array_keys(config('residence.careers'))),
            ],
        ]);

        $role = $isInstitutional ? 'institutional' : 'reader';

        $user = User::create([
            'name'     => $fields['name'],
            'email'    => $fields['email'],
            'password' => Hash::make($fields['password']),
            'role'     => $role,
            'career_code' => $isInstitutional ? $fields['career_code'] : null,
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user'  => [
                'name'  => $user->name,
                'email' => $user->email,
                'role'  => $user->role,
                'career_code' => $user->career_code,
            ],
            'token' => $token,
        ], 201);
    }

    public function login(Request $request)
    {
        $fields = $request->validate([
            'email'    => 'required|string|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $fields['email'])->first();

        if (!$user || !Hash::check($fields['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Las credenciales proporcionadas son incorrectas.'],
            ]);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user'  => [
                'name'  => $user->name,
                'email' => $user->email,
                'role'  => $user->role,
                'career_code' => $user->career_code,
            ],
            'token' => $token,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Sesión cerrada correctamente.'
        ]);
    }

    public function user(Request $request)
    {
        return response()->json([
            'user' => [
                'name'  => $request->user()->name,
                'email' => $request->user()->email,
                'role'  => $request->user()->role,
                'career_code' => $request->user()->career_code,
            ]
        ]);
    }
}