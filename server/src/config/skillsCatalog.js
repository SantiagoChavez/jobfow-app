/**
 * Catálogo base de habilidades técnicas y tecnologías del mercado para Jobflow.
 * Mapea variantes y alias a nombres canónicos normalizados.
 */

export const USER_SKILLS = [
  'JavaScript',
  'TypeScript',
  'Node.js',
  'Express',
  'React',
  'MongoDB',
  'PostgreSQL',
  'Python',
  'Git',
  'REST API',
  'Tailwind CSS',
  'Vitest',
  'HTML5',
  'CSS3',
];

/**
 * Diccionario maestro de tecnologías del mercado de software con sus variantes de búsqueda (alias).
 */
export const TECH_DICTIONARY = [
  // Lenguajes
  { name: 'JavaScript', aliases: ['javascript', 'js', 'es6', 'ecmascript'], regex: /\b(javascript|js|es6|ecmascript)\b/i },
  { name: 'TypeScript', aliases: ['typescript', 'ts'], regex: /\b(typescript|ts)\b/i },
  { name: 'Python', aliases: ['python', 'python3', 'py'], regex: /\b(python3?|py)\b/i },
  { name: 'Java', aliases: ['java'], regex: /\bjava\b(?!script)/i },
  { name: 'C#', aliases: ['c#', 'csharp'], regex: /(\bc#\b|\bcsharp\b)/i },
  { name: 'PHP', aliases: ['php'], regex: /\bphp\b/i },
  { name: 'Go', aliases: ['go', 'golang'], regex: /\b(golang|go\s+lang)\b/i },
  { name: 'Ruby', aliases: ['ruby', 'ruby on rails', 'rails'], regex: /\b(ruby(\s+on\s+rails)?|rails)\b/i },

  // Frontend
  { name: 'React', aliases: ['react', 'react.js', 'reactjs'], regex: /\breact(\.js|js)?\b/i },
  { name: 'Next.js', aliases: ['next.js', 'nextjs', 'next'], regex: /\bnext(\.js|js)?\b/i },
  { name: 'Vue', aliases: ['vue', 'vue.js', 'vuejs'], regex: /\bvue(\.js|js)?\b/i },
  { name: 'Angular', aliases: ['angular', 'angularjs'], regex: /\bangular(js)?\b/i },
  { name: 'Tailwind CSS', aliases: ['tailwind', 'tailwind css', 'tailwindcss'], regex: /\btailwind(\s*css)?\b/i },
  { name: 'HTML5', aliases: ['html', 'html5'], regex: /\bhtml5?\b/i },
  { name: 'CSS3', aliases: ['css', 'css3'], regex: /\bcss3?\b/i },
  { name: 'Redux', aliases: ['redux', 'redux toolkit'], regex: /\bredux(\s*toolkit)?\b/i },

  // Backend & APIs
  { name: 'Node.js', aliases: ['node', 'node.js', 'nodejs'], regex: /\bnode(\.js|js)?\b/i },
  { name: 'Express', aliases: ['express', 'express.js', 'expressjs'], regex: /\bexpress(\.js|js)?\b/i },
  { name: 'NestJS', aliases: ['nestjs', 'nest.js', 'nest'], regex: /\bnest(\.js|js)?\b/i },
  { name: 'FastAPI', aliases: ['fastapi'], regex: /\bfastapi\b/i },
  { name: 'Django', aliases: ['django'], regex: /\bdjango\b/i },
  { name: 'Spring Boot', aliases: ['spring boot', 'spring'], regex: /\bspring(\s*boot)?\b/i },
  { name: 'REST API', aliases: ['rest', 'rest api', 'restful', 'restful api', 'apis rest'], regex: /\brest(ful)?(\s*apis?)?\b/i },
  { name: 'GraphQL', aliases: ['graphql', 'gql'], regex: /\b(graphql|gql)\b/i },

  // Bases de Datos
  { name: 'MongoDB', aliases: ['mongodb', 'mongo', 'mongoose'], regex: /\b(mongo|mongodb|mongoose)\b/i },
  { name: 'PostgreSQL', aliases: ['postgresql', 'postgres', 'psql'], regex: /\b(postgres(ql)?|psql)\b/i },
  { name: 'MySQL', aliases: ['mysql'], regex: /\bmysql\b/i },
  { name: 'Redis', aliases: ['redis'], regex: /\bredis\b/i },
  { name: 'Firebase', aliases: ['firebase', 'firestore'], regex: /\b(firebase|firestore)\b/i },
  { name: 'Elasticsearch', aliases: ['elasticsearch', 'elastic'], regex: /\belastic(search)?\b/i },

  // DevOps & Cloud
  { name: 'Docker', aliases: ['docker', 'docker-compose'], regex: /\bdocker(-compose)?\b/i },
  { name: 'Kubernetes', aliases: ['kubernetes', 'k8s'], regex: /\b(kubernetes|k8s)\b/i },
  { name: 'AWS', aliases: ['aws', 'amazon web services'], regex: /\b(aws|amazon\s+web\s+services)\b/i },
  { name: 'Azure', aliases: ['azure'], regex: /\bazure\b/i },
  { name: 'GCP', aliases: ['gcp', 'google cloud'], regex: /\b(gcp|google\s+cloud(\s+platform)?)\b/i },
  { name: 'CI/CD', aliases: ['ci/cd', 'ci cd', 'github actions', 'jenkins'], regex: /\b(ci[\/-]?cd|github\s+actions|jenkins)\b/i },
  { name: 'Linux', aliases: ['linux', 'ubuntu', 'debian'], regex: /\b(linux|ubuntu|debian)\b/i },

  // Testing & Control de Versiones
  { name: 'Git', aliases: ['git', 'github', 'gitlab'], regex: /\b(git|github|gitlab)\b/i },
  { name: 'Vitest', aliases: ['vitest'], regex: /\bvitest\b/i },
  { name: 'Jest', aliases: ['jest'], regex: /\bjest\b/i },
  { name: 'Cypress', aliases: ['cypress'], regex: /\bcypress\b/i },
];

/**
 * Normaliza y verifica si una tecnología pertenece al catálogo del usuario.
 * @param {string} canonicalName
 * @param {Array<string>} [customSkills]
 * @returns {boolean}
 */
export const isUserSkill = (canonicalName, customSkills = USER_SKILLS) => {
  const normalizedUserSkills = customSkills.map((s) => s.toLowerCase());
  return normalizedUserSkills.includes(canonicalName.toLowerCase());
};

export default {
  USER_SKILLS,
  TECH_DICTIONARY,
  isUserSkill,
};
