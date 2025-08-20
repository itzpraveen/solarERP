const { sequelize } = require('../src/models');

async function checkColumns() {
  try {
    const [results] = await sequelize.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'leads' 
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);
    
    console.log('Columns in leads table:');
    results.forEach(row => console.log(`- ${row.column_name} (${row.data_type})`));
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkColumns();