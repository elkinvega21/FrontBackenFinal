import React, { useState, useEffect } from 'react';
// Importa el componente Login
import Login from './components/Login';
import Swal from 'sweetalert2'; // Asegúrate de tener SweetAlert2 instalado

// Importa los componentes de Recharts y otros necesarios para tu dashboard (el resto de tu App.jsx original)
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Componente principal de la aplicación
const App = () => {
  // Estado para la autenticación
  const [isAuthenticated, setIsAuthenticated] = useState(false); // true si el usuario está logueado

  // Estado y lógica del Dashboard original
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [dataPreview, setDataPreview] = useState([]);
  const [categoryDistribution, setCategoryDistribution] = useState([]);
  const [backendReady, setBackendReady] = useState(false);

  const API_BASE_URL = 'http://localhost:8000';

  // Verifica el token al cargar la aplicación para mantener la sesión
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      // Aquí podrías hacer una petición a /api/v1/auth/me para validar el token
      // Por ahora, asumimos que si hay token, el usuario está autenticado
      setIsAuthenticated(true);
    }
  }, []);

  // Verifica la conexión con el backend (mantenemos la lógica aquí)
  useEffect(() => {
    const checkBackendHealth = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/health`);
        if (response.ok) {
          setBackendReady(true);
          console.log("Backend is healthy!");
        } else {
          setBackendReady(false);
          Swal.fire({
            icon: 'error',
            title: 'Error de Conexión',
            text: `No se pudo conectar al backend. Asegúrate de que FastAPI esté corriendo en ${API_BASE_URL}.`,
            footer: '<a href="http://localhost:8000/api/docs" target="_blank">Ver documentación de la API</a>'
          });
        }
      } catch (error) {
        setBackendReady(false);
        Swal.fire({
          icon: 'error',
          title: 'Error de Red',
          text: `No se pudo alcanzar el backend. Asegúrate de que FastAPI esté corriendo en ${API_BASE_URL}.`,
          footer: '<a href="http://localhost:8000/api/docs" target="_blank">Ver documentación de la API</a>'
        });
        console.error("Error checking backend health:", error);
      }
    };
    checkBackendHealth();
  }, [API_BASE_URL]);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('token_type');
    setIsAuthenticated(false);
    Swal.fire('Sesión Cerrada', 'Has cerrado sesión correctamente.', 'info');
    // Limpiar estados del dashboard al cerrar sesión
    setSelectedFile(null);
    setUploadStatus('');
    setLoading(false);
    setDataPreview([]);
    setCategoryDistribution([]);
  };

  // --- Lógica del Dashboard (tu código original, casi sin cambios) ---
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const allowedTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
      if (!allowedTypes.includes(file.type)) {
        Swal.fire({
          icon: 'warning',
          title: 'Tipo de archivo no permitido',
          text: 'Por favor, selecciona un archivo CSV (.csv), XLS (.xls) o XLSX (.xlsx).',
        });
        setSelectedFile(null);
        setUploadStatus('');
        setDataPreview([]);
        setCategoryDistribution([]);
        return;
      }
      setSelectedFile(file);
      setUploadStatus('');
      setDataPreview([]);
      setCategoryDistribution([]);
    }
  };

  const handleFileUpload = async () => {
    if (!backendReady) {
        Swal.fire({
            icon: 'error',
            title: 'Backend no disponible',
            text: 'La conexión con el servidor backend no está establecida. Por favor, asegúrate de que esté corriendo.',
        });
        return;
    }

    if (!selectedFile) {
      Swal.fire({
        icon: 'warning',
        title: 'Archivo no seleccionado',
        text: 'Por favor, selecciona un archivo primero para subir.',
      });
      return;
    }

    setLoading(true);
    setUploadStatus('Subiendo y procesando...');

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      // Incluimos el token de autenticación en los headers
      const token = localStorage.getItem('access_token');
      const tokenType = localStorage.getItem('token_type');

      const response = await fetch(`${API_BASE_URL}/api/v1/data-ingestion/upload-csv-excel/`, {
        method: 'POST',
        headers: {
            'Authorization': `${tokenType} ${token}`, // Envía el token Bearer
        },
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setUploadStatus(`Éxito: ${result.message || 'Archivo procesado correctamente.'}`);
        setDataPreview(result.data_preview);
        processCategoryDistribution(result.data_preview, 'potential_category');
        Swal.fire('¡Éxito!', 'Archivo subido y procesado correctamente.', 'success');
      } else if (response.status === 401) { // Manejar específicamente errores de autenticación
          Swal.fire({
              icon: 'error',
              title: 'Acceso Denegado',
              text: 'Tu sesión ha expirado o no estás autorizado. Por favor, inicia sesión de nuevo.',
              showCancelButton: true,
              confirmButtonText: 'Iniciar Sesión',
              cancelButtonText: 'Cancelar'
          }).then((result) => {
              if (result.isConfirmed) {
                  handleLogout(); // Cerrar sesión y volver al login
              }
          });
          setUploadStatus('Error: Acceso Denegado');
      } else {
        let errorMessage = `Error: ${response.status} ${response.statusText}`;
        try {
          const errorResult = await response.json();
          errorMessage = `Error: ${errorResult.detail || errorResult.message || 'Error desconocido'}`;
          console.error('Error del backend:', errorResult);
          Swal.fire('Error', errorMessage, 'error');
        } catch (jsonError) {
          console.error('Error del backend (no JSON):', await response.text());
          Swal.fire('Error', 'Ha ocurrido un error inesperado en el servidor. Por favor, inténtalo de nuevo.', 'error');
        }
        setUploadStatus(errorMessage);
      }
    } catch (error) {
      setUploadStatus(`Error de red: ${error.message}`);
      console.error('Error de fetch (red):', error);
      Swal.fire('Error de Red', 'No se pudo conectar con el servidor. Verifica tu conexión.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const processCategoryDistribution = (data, categoryColumnName = 'potential_category') => {
    if (!data || data.length === 0) {
      setCategoryDistribution([]);
      return;
    }

    const counts = {};
    data.forEach(row => {
      const category = row[categoryColumnName] || 'Desconocido';
      counts[category] = (counts[category] || 0) + 1;
    });

    const chartData = Object.keys(counts).map(category => ({
      name: category,
      count: counts[category],
    }));

    setCategoryDistribution(chartData);
  };
  // --- Fin Lógica del Dashboard ---

  // Renderiza el Login si no está autenticado, de lo contrario, el Dashboard
  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Botón de Cerrar Sesión */}
      <button
        onClick={handleLogout}
        className="absolute top-4 right-4 px-4 py-2 rounded-lg shadow-md text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors duration-200"
      >
        Cerrar Sesión
      </button>

      {/* Todo el contenido de tu dashboard original */}
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-5xl border border-gray-200 transform hover:scale-105 transition-transform duration-300 ease-in-out">
        <h1 className="text-5xl font-extrabold text-gray-900 mb-8 text-center leading-tight">
          Dashboard de Análisis de Clientes
        </h1>

        {/* Sección de Subida de Archivos */}
        <div className="mb-10 p-8 border border-blue-400 rounded-lg bg-blue-50/70 backdrop-blur-sm shadow-inner">
          <h2 className="text-3xl font-bold text-blue-800 mb-5 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-3 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Subir Datos (CSV/Excel)
          </h2>
          <div className="flex flex-col sm:flex-row items-center space-y-5 sm:space-y-0 sm:space-x-6">
            <label className="block w-full sm:w-auto flex-grow cursor-pointer bg-white border border-gray-300 rounded-lg py-3 px-5 text-gray-700 text-base font-medium shadow-sm hover:border-blue-500 transition-all duration-200 ease-in-out">
              <input
                type="file"
                onChange={handleFileChange}
                className="hidden"
                accept=".csv, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              />
              {selectedFile ? selectedFile.name : 'Seleccionar archivo...'}
            </label>
            <button
              onClick={handleFileUpload}
              disabled={loading || !selectedFile || !backendReady}
              className="w-full sm:w-auto flex-shrink-0 py-3 px-8 rounded-lg shadow-lg text-base font-bold text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-300 transition-all duration-300 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Procesando...
                </>
              ) : (
                'Subir y Analizar'
              )}
            </button>
          </div>
          {uploadStatus && (
            <p className={`mt-5 text-base font-medium ${uploadStatus.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
              {uploadStatus}
            </p>
          )}
          {!backendReady && (
              <p className="mt-5 text-base font-medium text-red-600">
                  ⚠️ El backend no está disponible. Asegúrate de que tu API de FastAPI esté corriendo.
              </p>
          )}
        </div>

        {/* Sección de Vista Previa de Datos */}
        {dataPreview.length > 0 && (
          <div className="mb-10 p-8 border border-purple-400 rounded-lg bg-purple-50/70 backdrop-blur-sm shadow-inner">
            <h2 className="text-3xl font-bold text-purple-800 mb-5 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-3 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 2v-2m-9 4h6a2 2 0 002-2V9a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
              </svg>
              Vista Previa de Datos Procesados
            </h2>
            <div className="overflow-x-auto rounded-lg shadow-md border border-gray-200">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-100">
                  <tr>
                    {Object.keys(dataPreview[0]).map((key) => (
                      <th
                        key={key}
                        scope="col"
                        className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider"
                      >
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {dataPreview.map((row, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      {Object.values(row).map((value, idx) => (
                        <td key={idx} className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                          {String(value)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Sección de Visualización (Gráfico de Barras) */}
        {categoryDistribution.length > 0 && (
          <div className="p-8 border border-teal-400 rounded-lg bg-teal-50/70 backdrop-blur-sm shadow-inner">
            <h2 className="text-3xl font-bold text-teal-800 mb-5 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-3 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 5h18a2 2 0 012 2v10a2 2 0 01-2 2H3a2 2 0 01-2-2V7a2 2 0 012-2z" />
              </svg>
              Distribución de Categorías de Potencial
            </h2>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={categoryDistribution}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="name" angle={-15} textAnchor="end" height={60} interval={0} tick={{ fontSize: 12, fill: '#333' }} />
                <YAxis tickFormatter={(value) => `${value}`} tick={{ fill: '#333' }} />
                <Tooltip
                  cursor={{ fill: 'rgba(0,0,0,0.1)' }}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '8px', boxShadow: '0px 2px 10px rgba(0,0,0,0.1)' }}
                  labelStyle={{ color: '#555', fontWeight: 'bold' }}
                  itemStyle={{ color: '#3B82F6' }}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Bar dataKey="count" fill="#3B82F6" name="Número de Clientes" barSize={30} radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;