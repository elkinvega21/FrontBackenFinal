import React, { useState } from 'react';
import Swal from 'sweetalert2';

const API_BASE_URL = 'http://localhost:8001'; // Cambiado de API_URL a API_BASE_URL

const Register = ({ onRegisterSuccess, onGoToLogin }) => {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      Swal.fire({
        icon: 'warning',
        title: 'Contraseñas no coinciden',
        text: 'Por favor, asegúrate de que las contraseñas sean iguales.',
      });
      return;
    }

    setLoading(true);

    const userData = {
      email: email,
      full_name: fullName,
      password: password,
      confirm_password: confirmPassword,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const result = await response.json();

      if (response.ok) {
        Swal.fire(
          '¡Registro Exitoso!',
          result.message || 'Tu cuenta ha sido creada. Ahora puedes iniciar sesión.',
          'success'
        );
        onRegisterSuccess();
      } else {
        if (response.status === 422 && Array.isArray(result.detail)) {
          const validationErrors = result.detail.map((err) => err.msg).join(', ');
          Swal.fire('Error de Validación', validationErrors, 'warning');
        } else {
          const errorMessage = result.detail || result.message || 'Error desconocido al registrarse.';
          Swal.fire('Error de Registro', errorMessage, 'error');
        }
        console.error('Error del backend:', result);
      }
    } catch (error) {
      Swal.fire('Error de Red', 'No se pudo conectar con el servidor. Verifica tu conexión.', 'error');
      console.error('Error de fetch:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md border border-gray-200 transform hover:scale-105 transition-transform duration-300 ease-in-out">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-6 text-center leading-tight">
          Registrarse
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Crea una nueva cuenta para acceder al dashboard
        </p>

        <form onSubmit={handleRegister} className="space-y-6">
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre Completo
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              autoComplete="name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-lg"
              placeholder="Tu Nombre Completo"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Correo Electrónico
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-lg"
              placeholder="tu@ejemplo.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-lg"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirmar Contraseña
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-lg"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-lg font-bold text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-300 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              'Registrarse'
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-gray-600">
          ¿Ya tienes una cuenta?{' '}
          <button
            type="button"
            onClick={onGoToLogin}
            className="font-medium text-blue-600 hover:text-blue-500 focus:outline-none focus:underline"
          >
            Inicia Sesión aquí
          </button>
        </p>
      </div>
    </div>
  );
};

export default Register;


