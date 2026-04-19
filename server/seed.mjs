import { drizzle } from "drizzle-orm/mysql2";
import { sql } from "drizzle-orm";
import dotenv from "dotenv";

dotenv.config();

const db = drizzle(process.env.DATABASE_URL);

const exercises = [
  {
    name: "Table Pull (Hook)",
    nameEn: "Table Pull (Hook)",
    description: "Ejercicio fundamental de armwrestling que simula el movimiento de hook en la mesa.",
    category: "armwrestling",
    difficulty: "beginner",
    muscles: '["forearm flexors","pronators","biceps"]',
    equipment: '["armwrestling table","strap"]',
    instructions: '["Posiciona tu codo en el pad","Agarra la mano del oponente o strap","Prona la muñeca y tira hacia ti","Mantén el codo fijo en el pad"]',
    tips: '["Mantén el hombro sobre el codo","No levantes el codo del pad"]',
    commonMistakes: '["Levantar el codo","Usar solo el brazo sin involucrar el cuerpo"]',
  },
  {
    name: "Toproll Practice",
    nameEn: "Toproll Practice",
    description: "Práctica del movimiento de toproll, enfocado en la supinación y extensión de muñeca.",
    category: "armwrestling",
    difficulty: "intermediate",
    muscles: '["forearm extensors","supinators","brachioradialis"]',
    equipment: '["armwrestling table","strap"]',
    instructions: '["Posiciona tu mano alta en el agarre","Supina y extiende la muñeca","Camina los dedos sobre la mano del oponente","Aplica presión lateral"]',
    tips: '["Enfócate en la presión de dedos","Mantén la muñeca rígida"]',
    commonMistakes: '["Perder la posición de muñeca","No usar suficiente presión de dedos"]',
  },
  {
    name: "Wrist Curls",
    nameEn: "Wrist Curls",
    description: "Curl de muñeca con mancuerna para fortalecer los flexores del antebrazo.",
    category: "strength",
    difficulty: "beginner",
    muscles: '["forearm flexors","wrist flexors"]',
    equipment: '["dumbbell","bench"]',
    instructions: '["Siéntate con el antebrazo apoyado en el muslo","Agarra la mancuerna con palma hacia arriba","Flexiona la muñeca hacia arriba","Baja controladamente"]',
    tips: '["Usa rango completo de movimiento","No uses impulso"]',
    commonMistakes: '["Usar demasiado peso","Movimiento demasiado rápido"]',
  },
  {
    name: "Reverse Wrist Curls",
    nameEn: "Reverse Wrist Curls",
    description: "Curl de muñeca inverso para fortalecer los extensores del antebrazo.",
    category: "strength",
    difficulty: "beginner",
    muscles: '["forearm extensors","wrist extensors"]',
    equipment: '["dumbbell","bench"]',
    instructions: '["Siéntate con el antebrazo apoyado","Agarra con palma hacia abajo","Extiende la muñeca hacia arriba","Baja controladamente"]',
    tips: '["Mantén el antebrazo fijo","Concéntrate en la contracción"]',
    commonMistakes: '["Mover el antebrazo","Rango de movimiento incompleto"]',
  },
  {
    name: "Pronation Training",
    nameEn: "Pronation Training",
    description: "Entrenamiento específico de pronación con peso o banda elástica.",
    category: "armwrestling",
    difficulty: "intermediate",
    muscles: '["pronators","forearm flexors"]',
    equipment: '["loading pin","handle","resistance band"]',
    instructions: '["Agarra el mango con el codo a 90°","Rota la muñeca hacia adentro","Mantén la posición 2-3 segundos","Regresa controladamente"]',
    tips: '["Empieza con peso ligero","Enfócate en el control"]',
    commonMistakes: '["Usar el hombro en lugar de la muñeca","Movimiento explosivo sin control"]',
  },
  {
    name: "Supination Training",
    nameEn: "Supination Training",
    description: "Entrenamiento de supinación para el toproll.",
    category: "armwrestling",
    difficulty: "intermediate",
    muscles: '["supinators","biceps","brachioradialis"]',
    equipment: '["loading pin","handle"]',
    instructions: '["Agarra el mango con codo fijo","Rota la muñeca hacia afuera","Mantén la contracción","Regresa lentamente"]',
    tips: '["Mantén el codo pegado al cuerpo","Usa tempo lento"]',
    commonMistakes: '["Compensar con el hombro","Rango de movimiento parcial"]',
  },
  {
    name: "Cup Training",
    nameEn: "Cup Training",
    description: "Entrenamiento de cupping para cerrar la mano del oponente.",
    category: "armwrestling",
    difficulty: "advanced",
    muscles: '["finger flexors","forearm flexors","wrist flexors"]',
    equipment: '["thick grip","loading pin"]',
    instructions: '["Agarra el implemento grueso","Cierra los dedos con fuerza máxima","Flexiona la muñeca simultáneamente","Mantén 5-10 segundos"]',
    tips: '["Trabaja isométricos y dinámicos","Varía el grosor del agarre"]',
    commonMistakes: '["Solo trabajar agarre sin muñeca","No variar ángulos"]',
  },
  {
    name: "Rising (Back Pressure)",
    nameEn: "Rising (Back Pressure)",
    description: "Entrenamiento de presión trasera para mantener la posición.",
    category: "armwrestling",
    difficulty: "advanced",
    muscles: '["posterior deltoid","triceps","forearm"]',
    equipment: '["cable machine","armwrestling table"]',
    instructions: '["Posiciona el brazo en ángulo de competencia","Aplica presión hacia atrás y lateral","Mantén la muñeca firme","Controla el movimiento"]',
    tips: '["Simula la posición real de competencia","Trabaja en diferentes ángulos"]',
    commonMistakes: '["Perder la posición de muñeca","No mantener tensión constante"]',
  },
  {
    name: "Hammer Curls",
    nameEn: "Hammer Curls",
    description: "Curl con agarre neutro que fortalece el braquiorradial.",
    category: "strength",
    difficulty: "beginner",
    muscles: '["brachioradialis","biceps","forearm"]',
    equipment: '["dumbbells"]',
    instructions: '["De pie, mancuernas a los lados","Agarre neutro","Flexiona los codos","Baja controladamente"]',
    tips: '["No balancees el cuerpo","Mantén los codos fijos"]',
    commonMistakes: '["Usar impulso","Codos que se mueven hacia adelante"]',
  },
  {
    name: "Finger Walks",
    nameEn: "Finger Walks",
    description: "Ejercicio de dedos para mejorar la fuerza de agarre.",
    category: "technique",
    difficulty: "intermediate",
    muscles: '["finger flexors","finger extensors","intrinsic hand muscles"]',
    equipment: '["rubber band","finger trainer"]',
    instructions: '["Coloca una banda en los dedos","Abre y cierra contra resistencia","Alterna entre extensión y flexión","Trabaja cada dedo"]',
    tips: '["Haz series largas para resistencia","Varía la resistencia"]',
    commonMistakes: '["Movimientos demasiado rápidos","No trabajar todos los dedos"]',
  },
  {
    name: "Side Pressure Drills",
    nameEn: "Side Pressure Drills",
    description: "Ejercicios de presión lateral para mejorar la fuerza de empuje.",
    category: "armwrestling",
    difficulty: "intermediate",
    muscles: '["pectorals","anterior deltoid","triceps"]',
    equipment: '["cable machine","resistance band"]',
    instructions: '["Posiciona el brazo como en competencia","Empuja lateralmente","Mantén la posición","Controla el regreso"]',
    tips: '["Trabaja en el ángulo exacto","Incluye trabajo isométrico"]',
    commonMistakes: '["Perder la posición del codo","No simular el ángulo correcto"]',
  },
  {
    name: "Deadlifts",
    nameEn: "Deadlifts",
    description: "Peso muerto para fuerza general del cuerpo.",
    category: "strength",
    difficulty: "intermediate",
    muscles: '["back","glutes","hamstrings","forearms","traps"]',
    equipment: '["barbell","plates"]',
    instructions: '["Pies a la anchura de hombros","Agarra la barra","Mantén la espalda recta","Levanta extendiendo caderas y rodillas"]',
    tips: '["Usa agarre grueso","Mantén la barra cerca del cuerpo"]',
    commonMistakes: '["Redondear la espalda","Levantar con la espalda baja"]',
  },
  {
    name: "Plate Pinch",
    nameEn: "Plate Pinch",
    description: "Pellizco de discos para fuerza de agarre.",
    category: "strength",
    difficulty: "beginner",
    muscles: '["thumb","finger flexors","forearm"]',
    equipment: '["weight plates"]',
    instructions: '["Coloca dos discos lisos juntos","Pellizca con dedos y pulgar","Levanta y mantén","Aumenta el tiempo"]',
    tips: '["Empieza con discos de 5kg","Trabaja hasta 30 segundos"]',
    commonMistakes: '["Usar discos con bordes","No progresar en peso"]',
  },
  {
    name: "Band Pronation/Supination",
    nameEn: "Band Pronation/Supination",
    description: "Rotaciones de muñeca con banda elástica.",
    category: "conditioning",
    difficulty: "beginner",
    muscles: '["pronators","supinators","forearm"]',
    equipment: '["resistance band"]',
    instructions: '["Fija la banda a un punto estable","Agarra con el codo a 90°","Alterna entre pronación y supinación","Haz 15-20 repeticiones"]',
    tips: '["Ideal para calentamiento","Úsalo como finisher"]',
    commonMistakes: '["Banda demasiado fuerte","Movimientos bruscos"]',
  },
  {
    name: "Wrist Roller",
    nameEn: "Wrist Roller",
    description: "Rodillo de muñeca para resistencia de antebrazos.",
    category: "conditioning",
    difficulty: "beginner",
    muscles: '["forearm flexors","forearm extensors"]',
    equipment: '["wrist roller"]',
    instructions: '["Sostén el rodillo con brazos extendidos","Enrolla la cuerda","Desenrolla controladamente","Alterna dirección"]',
    tips: '["Mantén los brazos a la altura de los hombros","No dejes caer el peso"]',
    commonMistakes: '["Bajar los brazos por fatiga","Usar impulso"]',
  },
  {
    name: "Forearm Stretches",
    nameEn: "Forearm Stretches",
    description: "Estiramientos de antebrazo para prevención de lesiones.",
    category: "mobility",
    difficulty: "beginner",
    muscles: '["forearm flexors","forearm extensors","wrist"]',
    equipment: "[]",
    instructions: '["Extiende el brazo con palma hacia arriba","Tira los dedos hacia abajo","Mantén 20-30 segundos","Repite con palma hacia abajo"]',
    tips: '["Hazlos antes y después de entrenar","Nunca estires en frío"]',
    commonMistakes: '["Estirar con dolor","Mantener muy poco tiempo"]',
  },
];

const achievementsList = [
  { name: "First Pull", description: "Completa tu primer entrenamiento", category: "consistency", rarity: "common", icon: "💪", xpReward: 50, criteria: '{"totalWorkouts":1}' },
  { name: "Week Warrior", description: "Completa 7 entrenamientos", category: "consistency", rarity: "common", icon: "🔥", xpReward: 100, criteria: '{"totalWorkouts":7}' },
  { name: "Iron Grip", description: "Completa 30 entrenamientos", category: "consistency", rarity: "rare", icon: "🦾", xpReward: 300, criteria: '{"totalWorkouts":30}' },
  { name: "Unstoppable", description: "Completa 100 entrenamientos", category: "consistency", rarity: "epic", icon: "⚡", xpReward: 1000, criteria: '{"totalWorkouts":100}' },
  { name: "Legend of the Table", description: "Completa 365 entrenamientos", category: "consistency", rarity: "legendary", icon: "👑", xpReward: 5000, criteria: '{"totalWorkouts":365}' },
  { name: "Streak Starter", description: "Mantén una racha de 3 días", category: "consistency", rarity: "common", icon: "🔥", xpReward: 75, criteria: '{"streak":3}' },
  { name: "On Fire", description: "Mantén una racha de 7 días", category: "consistency", rarity: "rare", icon: "🔥", xpReward: 200, criteria: '{"streak":7}' },
  { name: "Inferno", description: "Mantén una racha de 30 días", category: "consistency", rarity: "epic", icon: "🌋", xpReward: 750, criteria: '{"streak":30}' },
  { name: "Hook Master", description: "Completa 50 ejercicios de hook", category: "technique", rarity: "rare", icon: "🪝", xpReward: 250, criteria: '{"hookExercises":50}' },
  { name: "Toproll King", description: "Completa 50 ejercicios de toproll", category: "technique", rarity: "rare", icon: "🏔️", xpReward: 250, criteria: '{"toprollExercises":50}' },
  { name: "PR Crusher", description: "Establece tu primer PR", category: "strength", rarity: "common", icon: "🏆", xpReward: 100, criteria: '{"prs":1}' },
  { name: "PR Machine", description: "Establece 10 PRs", category: "strength", rarity: "rare", icon: "🎯", xpReward: 400, criteria: '{"prs":10}' },
  { name: "Volume King", description: "Levanta 10,000 kg en total", category: "strength", rarity: "rare", icon: "🏋️", xpReward: 300, criteria: '{"totalVolume":10000}' },
  { name: "Titan", description: "Levanta 100,000 kg en total", category: "strength", rarity: "legendary", icon: "🗿", xpReward: 2000, criteria: '{"totalVolume":100000}' },
  { name: "Early Bird", description: "Entrena antes de las 7 AM", category: "special", rarity: "common", icon: "🌄", xpReward: 50, criteria: '{"earlyWorkout":1}' },
  { name: "Night Owl", description: "Entrena después de las 10 PM", category: "special", rarity: "common", icon: "🦉", xpReward: 50, criteria: '{"lateWorkout":1}' },
];

async function seed() {
  console.log("Seeding exercises...");
  for (const exercise of exercises) {
    await db.execute(sql`
      INSERT INTO exercise_templates
        (name, nameEn, description, category, difficulty, muscles, equipment, instructions, tips, commonMistakes, isPublic)
      VALUES
        (${exercise.name}, ${exercise.nameEn}, ${exercise.description}, ${exercise.category}, ${exercise.difficulty}, ${exercise.muscles}, ${exercise.equipment}, ${exercise.instructions}, ${exercise.tips}, ${exercise.commonMistakes}, true)
    `);
  }
  console.log(`Seeded ${exercises.length} exercises`);

  console.log("Seeding achievements...");
  for (const achievement of achievementsList) {
    await db.execute(sql`
      INSERT INTO achievements
        (name, description, category, rarity, icon, xpReward, criteria)
      VALUES
        (${achievement.name}, ${achievement.description}, ${achievement.category}, ${achievement.rarity}, ${achievement.icon}, ${achievement.xpReward}, ${achievement.criteria})
    `);
  }
  console.log(`Seeded ${achievementsList.length} achievements`);

  console.log("Seeding sample programs...");
  const samplePrograms = [
    { name: "Beginner Hook Mastery", description: "Programa de 4 semanas para dominar la técnica de hook desde cero.", price: 0, difficulty: "beginner", durationWeeks: 4, category: "technique", tags: '["hook","beginner","technique"]', rating: 4.5, reviewCount: 12, purchaseCount: 45 },
    { name: "Elite Toproll System", description: "Sistema avanzado de toproll con progresión de 8 semanas para competidores.", price: 29.99, difficulty: "advanced", durationWeeks: 8, category: "competition", tags: '["toproll","advanced","competition"]', rating: 4.8, reviewCount: 8, purchaseCount: 23 },
    { name: "Forearm Destroyer", description: "Programa intensivo de 6 semanas para maximizar la fuerza de antebrazo.", price: 19.99, difficulty: "intermediate", durationWeeks: 6, category: "strength", tags: '["forearm","strength","hypertrophy"]', rating: 4.3, reviewCount: 15, purchaseCount: 67 },
    { name: "Competition Prep 12-Week", description: "Preparación completa de 12 semanas para competencia de armwrestling.", price: 49.99, difficulty: "elite", durationWeeks: 12, category: "competition", tags: '["competition","peaking","elite"]', rating: 4.9, reviewCount: 5, purchaseCount: 12 },
    { name: "Grip & Wrist Foundation", description: "Fundamentos de agarre y muñeca para principiantes en armwrestling.", price: 0, difficulty: "beginner", durationWeeks: 4, category: "foundation", tags: '["grip","wrist","foundation"]', rating: 4.6, reviewCount: 20, purchaseCount: 89 },
  ];
  for (const program of samplePrograms) {
    await db.execute(sql`
      INSERT INTO programs
        (name, description, createdById, price, difficulty, durationWeeks, category, isPublished, tags, rating, reviewCount, purchaseCount)
      VALUES
        (${program.name}, ${program.description}, 1, ${program.price}, ${program.difficulty}, ${program.durationWeeks}, ${program.category}, true, ${program.tags}, ${program.rating}, ${program.reviewCount}, ${program.purchaseCount})
    `);
  }
  console.log(`Seeded ${samplePrograms.length} programs`);

  console.log("Seed complete!");
  process.exit(0);
}

seed().catch(error => {
  console.error(error);
  process.exit(1);
});
