const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    if (req.method === 'GET') {
      const limit = parseInt(req.query.limit) || 20;

      // Obtener todas las asistencias
      const { data, error } = await supabase
        .from('asistencias')
        .select('*')
        .order('fecha', { ascending: false });

      if (error) throw error;

      // Agrupar por fecha y tipo
      const eventos = {};

      data.forEach(row => {
        const key = `${row.fecha}|${row.tipo}`;

        if (!eventos[key]) {
          eventos[key] = {
            fecha: row.fecha,
            tipo: row.tipo,
            presentes: 0,
            ausentes: 0,
            total: 0
          };
        }

        eventos[key].total++;

        if (row.ausente) {
          eventos[key].ausentes++;
        } else {
          eventos[key].presentes++;
        }
      });

      // Convertir a array y ordenar por fecha descendente
      const historial = Object.values(eventos)
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
        .slice(0, limit);

      return res.status(200).json(historial);
    }

    return res.status(405).json({ error: 'Método no permitido' });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: error.message });
  }
};
