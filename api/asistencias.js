import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    if (req.method === 'POST') {
      // Registrar asistencia
      const { fecha, tipo, ausentes, notas } = req.body;

      if (!fecha || !tipo) {
        return res.status(400).json({ error: 'Fecha y tipo son requeridos' });
      }

      // Obtener todos los miembros activos
      const { data: miembros, error: errorMiembros } = await supabase
        .from('miembros')
        .select('*')
        .eq('activo', true);

      if (errorMiembros) throw errorMiembros;

      // Verificar si ya existe un registro para esta fecha y tipo
      const { data: existente, error: errorCheck } = await supabase
        .from('asistencias')
        .select('id')
        .eq('fecha', fecha)
        .eq('tipo', tipo)
        .limit(1);

      if (errorCheck) throw errorCheck;

      if (existente && existente.length > 0) {
        return res.status(400).json({
          success: false,
          mensaje: 'Ya existe un registro para esta fecha y tipo de evento.'
        });
      }

      // Crear array de IDs ausentes
      const ausentesSet = new Set(ausentes || []);

      // Crear registros de asistencia para cada miembro
      const registros = miembros.map(miembro => ({
        fecha,
        tipo,
        id_miembro: miembro.id,
        nombre: miembro.nombre,
        ausente: ausentesSet.has(miembro.id),
        notas: ausentesSet.has(miembro.id) ? (notas || '') : ''
      }));

      const { data, error } = await supabase
        .from('asistencias')
        .insert(registros);

      if (error) throw error;

      return res.status(201).json({
        success: true,
        mensaje: `Asistencia registrada correctamente para ${miembros.length} miembros`
      });
    }

    return res.status(405).json({ error: 'Método no permitido' });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
