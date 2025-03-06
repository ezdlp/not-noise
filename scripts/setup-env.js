import fs from 'fs';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('Supabase Connection Setup');
console.log('=========================');
console.log('This script will help you set up your Supabase connection details.');
console.log('You can find these in your Supabase dashboard under Project Settings.');
console.log('');

const questions = [
  {
    name: 'SUPABASE_URL',
    prompt: 'Enter your Supabase URL (e.g., https://your-project-id.supabase.co):',
    default: 'https://your-project-id.supabase.co'
  },
  {
    name: 'SUPABASE_ANON_KEY',
    prompt: 'Enter your Supabase anon key:',
    default: ''
  },
  {
    name: 'SUPABASE_SERVICE_ROLE_KEY',
    prompt: 'Enter your Supabase service role key:',
    default: ''
  },
  {
    name: 'DB_HOST',
    prompt: 'Enter your database host (e.g., your-project-id.supabase.co):',
    default: ''
  },
  {
    name: 'DB_PASSWORD',
    prompt: 'Enter your database password:',
    default: ''
  }
];

const answers = {};

function askQuestion(index) {
  if (index >= questions.length) {
    writeEnvFile();
    return;
  }

  const question = questions[index];
  const defaultText = question.default ? ` (default: ${question.default})` : '';
  
  rl.question(`${question.prompt}${defaultText} `, (answer) => {
    answers[question.name] = answer || question.default;
    askQuestion(index + 1);
  });
}

function writeEnvFile() {
  const envContent = `# Supabase Connection
SUPABASE_URL=${answers.SUPABASE_URL}
SUPABASE_ANON_KEY=${answers.SUPABASE_ANON_KEY}
SUPABASE_SERVICE_ROLE_KEY=${answers.SUPABASE_SERVICE_ROLE_KEY}

# Database Connection
DATABASE_URL=postgresql://postgres:${answers.DB_PASSWORD}@${answers.DB_HOST}:5432/postgres
`;

  fs.writeFileSync('.env', envContent);
  
  console.log('\nEnvironment file (.env) has been created successfully!');
  console.log('You can now run the database connection test with:');
  console.log('node scripts/db-connect.js');
  
  rl.close();
}

askQuestion(0); 